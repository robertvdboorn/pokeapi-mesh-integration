import { capitalize } from "./format";

/**
 * Builds a friendly, domain-specific field model for the Data Resource Selector
 * location from the *known* edgehancer output (see edgehancer/shared.ts → transformPokemon).
 *
 * Because we control the shape of the resolved data, we never have to expose the
 * raw JSON tree to authors — instead we surface curated, previewable fields with
 * correct JSON pointers.
 */

/** JSON value categories that Uniform can bind a dynamic token to. */
export type BindableType = "string" | "number" | "boolean" | "object" | "array";

export type FieldKind = "text" | "number" | "boolean" | "image" | "object" | "array";

export interface PickField {
  /** Stable key for React lists. */
  key: string;
  /** RFC 6901 JSON pointer, e.g. "/name/formatted" or "/0/sprites/front_default". */
  pointer: string;
  /** Human friendly label. */
  label: string;
  /** Optional secondary description shown under the label. */
  hint?: string;
  /** The underlying JSON value category (used for allowedTypes filtering). */
  jsonType: BindableType;
  /** How the field should be rendered. */
  kind: FieldKind;
  /** Resolved value, used for previews. */
  value: unknown;
}

export interface FieldGroup {
  key: string;
  title: string;
  /** When true, render the fields as an image grid instead of chips. */
  layout?: "chips" | "images" | "stats" | "list";
  fields: PickField[];
}

export interface PokemonCard {
  /** JSON pointer prefix for this card ("" for a single resource, "/2" inside an array). */
  prefix: string;
  pokedexId?: number;
  displayName: string;
  /** Hero artwork URL (best available sprite). */
  artwork?: string;
  /** Primary type slug (lowercase) for theming. */
  primaryType?: string;
  /** Type pills are themselves selectable. */
  typePills: { label: string; slug: string; pointer: string }[];
  groups: FieldGroup[];
}

// ─── Type theming ────────────────────────────────────────────────────────────

export const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

export const typeColor = (slug?: string): string =>
  (slug && TYPE_COLORS[slug.toLowerCase()]) || "#6B7280";

// ─── JSON pointer helpers ─────────────────────────────────────────────────────

const escapeSegment = (segment: string): string =>
  segment.replace(/~/g, "~0").replace(/\//g, "~1");

const buildPointer = (segments: (string | number)[]): string =>
  segments.length === 0
    ? ""
    : "/" + segments.map((s) => escapeSegment(String(s))).join("/");

/** Resolve a JSON pointer against a root value (used for previewing the current selection). */
export const resolvePointer = (root: unknown, pointer: string): unknown => {
  if (!pointer) return root;
  const parts = pointer
    .split("/")
    .slice(1)
    .map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
  let current: any = root;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
};

export const jsonTypeOf = (value: unknown): BindableType | null => {
  if (Array.isArray(value)) return "array";
  if (value === null || value === undefined) return null;
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "object":
      return "object";
    default:
      return null;
  }
};

const IMAGE_EXT = /\.(png|jpe?g|gif|svg|webp|avif)(\?|#|$)/i;

const isImageUrl = (value: unknown): value is string =>
  typeof value === "string" && /^https?:\/\//.test(value) && IMAGE_EXT.test(value);

// ─── Label helpers ─────────────────────────────────────────────────────────────

const SPRITE_KEY_LABELS: Record<string, string> = {
  front_default: "Front",
  front_shiny: "Front · shiny",
  front_female: "Front · female",
  front_shiny_female: "Front · shiny female",
  back_default: "Back",
  back_shiny: "Back · shiny",
  back_female: "Back · female",
  back_shiny_female: "Back · shiny female",
};

const SPRITE_GROUP_LABELS: Record<string, string> = {
  "official-artwork": "Official artwork",
  home: "Home",
  dream_world: "Dream world",
  showdown: "Showdown",
};

const spriteKeyLabel = (key: string): string =>
  SPRITE_KEY_LABELS[key] || capitalize(key.replace(/_/g, "-"));

const spriteGroupLabel = (group: string): string =>
  SPRITE_GROUP_LABELS[group] || capitalize(group.replace(/_/g, "-"));

// ─── Field builders ──────────────────────────────────────────────────────────

const field = (
  prefix: string,
  segments: (string | number)[],
  label: string,
  jsonType: BindableType,
  kind: FieldKind,
  value: unknown,
  hint?: string
): PickField => {
  const pointer = prefix + buildPointer(segments);
  return { key: pointer || "/", pointer, label, jsonType, kind, value, hint };
};

/**
 * Collect previewable sprite images from the known sprites object.
 * We intentionally skip `versions` (the per-generation archive) to keep the picker tidy,
 * and surface the official artwork first.
 */
const collectImages = (prefix: string, sprites: any): PickField[] => {
  const out: PickField[] = [];
  if (!sprites || typeof sprites !== "object") return out;

  for (const [key, value] of Object.entries(sprites)) {
    if (key === "other" || key === "versions") continue;
    if (isImageUrl(value)) {
      out.push(field(prefix, ["sprites", key], spriteKeyLabel(key), "string", "image", value));
    }
  }

  const other = sprites.other;
  if (other && typeof other === "object") {
    for (const [group, groupValue] of Object.entries(other)) {
      if (!groupValue || typeof groupValue !== "object") continue;
      for (const [key, value] of Object.entries(groupValue as Record<string, unknown>)) {
        if (isImageUrl(value)) {
          out.push(
            field(
              prefix,
              ["sprites", "other", group, key],
              `${spriteGroupLabel(group)} · ${spriteKeyLabel(key)}`,
              "string",
              "image",
              value
            )
          );
        }
      }
    }
  }

  // Official artwork is the nicest hero image, so float it to the front.
  return out.sort((a, b) => {
    const aArt = a.pointer.includes("official-artwork") ? 0 : 1;
    const bArt = b.pointer.includes("official-artwork") ? 0 : 1;
    return aArt - bArt;
  });
};

const MAX_MOVES = 24;

const buildCard = (prefix: string, pokemon: any): PokemonCard => {
  const displayName =
    pokemon?.name?.formatted ||
    (typeof pokemon?.name === "string" ? capitalize(pokemon.name) : undefined) ||
    pokemon?.species?.name ||
    "Pokémon";

  const images = collectImages(prefix, pokemon?.sprites);
  const artwork = images[0]?.value as string | undefined;

  const types: any[] = Array.isArray(pokemon?.types) ? pokemon.types : [];
  const primaryType = types[0]?.name;

  const groups: FieldGroup[] = [];

  // Identity ────────────────────────────────────────────────────────────────
  const identity: PickField[] = [];
  if (pokemon?.name?.formatted)
    identity.push(field(prefix, ["name", "formatted"], "Display name", "string", "text", pokemon.name.formatted));
  if (pokemon?.name?.original)
    identity.push(field(prefix, ["name", "original"], "API name", "string", "text", pokemon.name.original));
  else if (typeof pokemon?.name === "string")
    identity.push(field(prefix, ["name"], "Name", "string", "text", pokemon.name));
  if (typeof pokemon?.id === "number")
    identity.push(field(prefix, ["id"], "Pokédex number", "number", "number", pokemon.id));
  if (pokemon?.species?.name)
    identity.push(field(prefix, ["species", "name"], "Species", "string", "text", pokemon.species.name));
  if (pokemon?.name && typeof pokemon.name === "object")
    identity.push(field(prefix, ["name"], "Name (object)", "object", "object", pokemon.name, "Both display + API name"));
  if (identity.length) groups.push({ key: "identity", title: "Identity", layout: "chips", fields: identity });

  // Media ─────────────────────────────────────────────────────────────────────
  if (images.length) {
    const media = [...images];
    if (pokemon?.sprites && typeof pokemon.sprites === "object")
      media.push(field(prefix, ["sprites"], "All sprites (object)", "object", "object", pokemon.sprites));
    groups.push({ key: "media", title: "Images", layout: "images", fields: media });
  }

  // Types ──────────────────────────────────────────────────────────────────────
  const typePills = types
    .map((t: any, i: number) => ({
      label: t?.formatted || (t?.name ? capitalize(t.name) : `Type ${i + 1}`),
      slug: (t?.name || "").toLowerCase(),
      pointer: prefix + buildPointer(["types", i, "formatted"]),
    }))
    .filter((p) => p.slug);

  if (types.length) {
    const typeFields: PickField[] = types.map((t: any, i: number) =>
      field(prefix, ["types", i, "formatted"], t?.formatted || capitalize(t?.name || `Type ${i + 1}`), "string", "text", t?.formatted || capitalize(t?.name || ""))
    );
    typeFields.push(field(prefix, ["types"], "All types (list)", "array", "array", types));
    groups.push({ key: "types", title: "Types", layout: "chips", fields: typeFields });
  }

  // Measurements ─────────────────────────────────────────────────────────────
  const measurements: PickField[] = [];
  if (typeof pokemon?.height === "number")
    measurements.push(field(prefix, ["height"], "Height", "number", "number", pokemon.height, "decimetres"));
  if (typeof pokemon?.weight === "number")
    measurements.push(field(prefix, ["weight"], "Weight", "number", "number", pokemon.weight, "hectograms"));
  if (typeof pokemon?.baseExperience === "number")
    measurements.push(field(prefix, ["baseExperience"], "Base experience", "number", "number", pokemon.baseExperience));
  if (measurements.length)
    groups.push({ key: "measurements", title: "Measurements", layout: "chips", fields: measurements });

  // Stats ────────────────────────────────────────────────────────────────────
  const stats: any[] = Array.isArray(pokemon?.stats) ? pokemon.stats : [];
  if (stats.length) {
    const statFields: PickField[] = stats.map((s: any, i: number) =>
      field(
        prefix,
        ["stats", i, "value"],
        s?.formatted || capitalize(s?.name || `Stat ${i + 1}`),
        "number",
        "number",
        s?.value
      )
    );
    statFields.push(field(prefix, ["stats"], "All stats (list)", "array", "array", stats));
    groups.push({ key: "stats", title: "Base stats", layout: "stats", fields: statFields });
  }

  // Abilities ──────────────────────────────────────────────────────────────────
  const abilities: any[] = Array.isArray(pokemon?.abilities) ? pokemon.abilities : [];
  if (abilities.length) {
    const abilityFields: PickField[] = abilities.map((a: any, i: number) =>
      field(
        prefix,
        ["abilities", i, "formatted"],
        a?.formatted || capitalize(a?.name || `Ability ${i + 1}`),
        "string",
        "text",
        a?.formatted || capitalize(a?.name || ""),
        a?.isHidden ? "Hidden ability" : undefined
      )
    );
    abilityFields.push(field(prefix, ["abilities"], "All abilities (list)", "array", "array", abilities));
    groups.push({ key: "abilities", title: "Abilities", layout: "chips", fields: abilityFields });
  }

  // Moves ────────────────────────────────────────────────────────────────────
  const moves: any[] = Array.isArray(pokemon?.moves) ? pokemon.moves : [];
  if (moves.length) {
    const moveFields: PickField[] = moves
      .slice(0, MAX_MOVES)
      .map((m: any, i: number) =>
        field(prefix, ["moves", i, "formatted"], m?.formatted || capitalize(m?.name || `Move ${i + 1}`), "string", "text", m?.formatted || capitalize(m?.name || ""))
      );
    moveFields.push(
      field(
        prefix,
        ["moves"],
        moves.length > MAX_MOVES ? `All ${moves.length} moves (list)` : "All moves (list)",
        "array",
        "array",
        moves
      )
    );
    groups.push({ key: "moves", title: "Moves", layout: "chips", fields: moveFields });
  }

  return { prefix, pokedexId: typeof pokemon?.id === "number" ? pokemon.id : undefined, displayName, artwork, primaryType, typePills, groups };
};

/**
 * Build the full card model from a resolved data resource value.
 * Handles both a single Pokémon object and an array of Pokémon (multi archetype),
 * as well as the lightweight (direct) and full (proxy) edgehancer shapes.
 */
export const buildPokemonCards = (resolved: unknown): PokemonCard[] => {
  if (Array.isArray(resolved)) {
    return resolved
      .filter((item) => item && typeof item === "object")
      .map((item, i) => buildCard(buildPointer([i]), item));
  }
  if (resolved && typeof resolved === "object") {
    return [buildCard("", resolved)];
  }
  return [];
};
