import {
  getDataResourceAsRequest,
  type RequestEdgehancerDataResourceResolutionResult,
  type RequestHookFn,
} from "@uniformdev/mesh-edgehancer-sdk";
import { capitalize, extractIdFromUrl } from "./shared";

/**
 * Injected at build time by tsup `define`.
 * Set POKEAPI_PROXY_URL in your environment before running `edgehancer:build`
 * to enable the proxy codepath. When unset, falls back to direct PokeAPI fetch.
 *
 * @example POKEAPI_PROXY_URL=https://pokeapi-proxy.example.com pnpm edgehancer:build
 */
declare const __POKEAPI_PROXY_URL__: string | undefined;

const PROXY_URL = typeof __POKEAPI_PROXY_URL__ !== "undefined" ? __POKEAPI_PROXY_URL__ : "";

// ─── Proxy codepath ─────────────────────────────────────────────────────────

/**
 * Fetch via the pokeapi-proxy batch endpoint (1 subrequest).
 * Returns full transformed data with caching and name resolution handled server-side.
 */
async function fetchViaProxy(
  selectedIds: string[],
  result: Required<RequestEdgehancerDataResourceResolutionResult>
): Promise<void> {
  const proxyUrl = `${PROXY_URL}/pokemon/batch?ids=${selectedIds.join(",")}`;
  const response = await fetch(proxyUrl);

  if (!response.ok) {
    const text = await response.text();
    result.errors.push(`Proxy request failed: ${response.status} ${text}`);
    return;
  }

  const data = (await response.json()) as {
    results: Record<string, any>[];
    meta: {
      total: number;
      cached: number;
      fetched: number;
      failed: string[];
      duration_ms: number;
    };
  };

  for (const name of data.meta.failed) {
    result.warnings.push(`Pokemon not found: ${name}`);
  }

  result.infos.push(
    `Proxy: ${data.meta.cached} cached, ${data.meta.fetched} fetched in ${data.meta.duration_ms}ms`
  );

  result.result = data.results;
}

// ─── Direct PokeAPI codepath ────────────────────────────────────────────────

/**
 * Fetch directly from PokeAPI using the list endpoint (1 subrequest).
 * Returns lightweight data per Pokemon (id, name, sprites via convention).
 */
async function fetchDirect(
  selectedIds: string[],
  origin: string,
  result: Required<RequestEdgehancerDataResourceResolutionResult>
): Promise<void> {
  const listUrl = `${origin}/api/v2/pokemon?limit=10000&offset=0`;
  const response = await fetch(listUrl);

  if (!response.ok) {
    result.errors.push(`Failed to fetch Pokemon list: ${response.status}`);
    return;
  }

  const data = (await response.json()) as {
    results: Array<{ name: string; url: string }>;
  };

  const pokemon = selectedIds
    .map((selectedId) => {
      const entry = data.results.find((p) => {
        const numericId = extractIdFromUrl(p.url);
        return (
          p.name.toLowerCase() === selectedId.toLowerCase() ||
          (numericId !== null && numericId.toString() === selectedId)
        );
      });

      if (!entry) {
        result.warnings.push(`Pokemon not found: ${selectedId}`);
        return null;
      }

      const id = extractIdFromUrl(entry.url);
      return {
        id,
        name: {
          original: entry.name,
          formatted: capitalize(entry.name),
        },
        url: entry.url,
        sprites: id
          ? {
              front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
              front_shiny: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`,
            }
          : null,
      };
    })
    .filter(Boolean);

  result.result = pokemon;
}

// ─── Edgehancer hook ────────────────────────────────────────────────────────

/**
 * Multi-Pokemon edgehancer.
 *
 * When POKEAPI_PROXY_URL is set at build time:
 *   → calls the proxy batch endpoint (1 subrequest) for full transformed data
 *
 * When not set (default / open-source):
 *   → fetches the PokeAPI list directly (1 subrequest) with lightweight data
 */
const request: RequestHookFn = async ({ dataResources }) => {
  const results = dataResources.map<
    Promise<RequestEdgehancerDataResourceResolutionResult>
  >(async ({ dataResource }) => {
    const result: Required<RequestEdgehancerDataResourceResolutionResult> = {
      errors: [],
      warnings: [],
      infos: [],
      result: {},
      surrogateKeys: [],
    };

    const req = getDataResourceAsRequest(dataResource);

    // URL is like https://pokeapi.co/api/v2/pokemon/1,4,7
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const idsString = pathParts[pathParts.length - 1] || "";
    const selectedIds = idsString
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (selectedIds.length === 0) {
      result.errors.push("No Pokemon IDs provided");
      return result;
    }

    try {
      if (PROXY_URL) {
        await fetchViaProxy(selectedIds, result);
      } else {
        await fetchDirect(selectedIds, url.origin, result);
      }
    } catch (e) {
      result.errors.push(`Failed to fetch Pokemon: ${e}`);
    }

    return result;
  });

  return {
    results: await Promise.all(results),
  };
};

export default request;
