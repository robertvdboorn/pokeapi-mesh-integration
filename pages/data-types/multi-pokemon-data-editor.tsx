import React, { useState, useEffect, useCallback, useRef } from "react";
import { useMeshLocation } from "@uniformdev/mesh-sdk-react";

import { PokemonSelector, Pokemon } from "../../components/PokemonSelector";
import { useAsync } from "react-use";
import { ErrorCallout } from "../../components/ErrorCallout";
import { PokemonTypeConfig } from "./single-pokemon-type-editor";
import {
  DEFAULT_IMAGE_PATH,
  POKEAPI_BASE_URL,
  POKEAPI_POKEMON_ENDPOINT,
  POKEAPI_POKEMON_ENDPOINT_QUERY,
  extractIdFromUrl,
  getOfficialArtworkUrl,
} from "../../constants/pokeapi";
import { capitalize, getValueFromPath } from "../../utils/format";

const BATCH_SIZE = 20;

const MultiPokemonDataEditor: React.FC = () => {
  const { value, metadata, setValue } = useMeshLocation<"dataResource">();

  const custom = metadata.dataType as unknown as PokemonTypeConfig;
  const imagePath = custom?.custom?.imagePath || DEFAULT_IMAGE_PATH;

  // id is stored as a comma-separated string of slugs (matches ${id} in the path template)
  const idsString = (value?.id as string) || "";
  const selectedSlugs = idsString ? idsString.split(",").filter(Boolean) : [];

  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const abortRef = useRef(false);

  // Phase 1: Fetch the lightweight list instantly
  const {
    value: rawList,
    loading: loadingList,
    error: listError,
  } = useAsync(async () => {
    const response = await fetch(
      `${POKEAPI_BASE_URL}${POKEAPI_POKEMON_ENDPOINT}${POKEAPI_POKEMON_ENDPOINT_QUERY}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch Pokémon list: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    return data.results.map((pokemon: { name: string; url: string }) => {
      const pokemonId = extractIdFromUrl(pokemon.url);
      return {
        id: pokemonId,
        slug: pokemon.name,
        name: capitalize(pokemon.name),
        url: pokemon.url,
        image: getOfficialArtworkUrl(pokemonId),
      };
    });
  }, []);

  useEffect(() => {
    if (rawList) {
      setPokemonList(rawList);
    }
  }, [rawList]);

  // Phase 2: Progressively batch-load details
  const loadDetails = useCallback(
    async (list: { url: string; id: number; slug: string; name: string }[]) => {
      abortRef.current = false;

      for (let i = 0; i < list.length; i += BATCH_SIZE) {
        if (abortRef.current) return;

        const batch = list.slice(i, i + BATCH_SIZE);
        const enriched = await Promise.all(
          batch.map(async (pokemon) => {
            try {
              const res = await fetch(pokemon.url);
              if (!res.ok) return pokemon;
              const detail = await res.json();

              return {
                id: detail.id,
                slug: detail.name,
                name: capitalize(detail.name),
                image:
                  getValueFromPath(detail, imagePath) ||
                  getOfficialArtworkUrl(detail.id),
                types: (detail.types ?? []).map((t: any) => capitalize(t.type.name)),
                height: detail.height * 10,
                weight: detail.weight / 10,
                abilities: (detail.abilities ?? []).map((a: any) =>
                  capitalize(a.ability.name)
                ),
                stats: (detail.stats ?? []).map((s: any) => ({
                  name: capitalize(s.stat.name.replace(/-/g, " ")),
                  value: s.base_stat,
                })),
              };
            } catch {
              return pokemon;
            }
          })
        );

        if (abortRef.current) return;

        setPokemonList((prev) => {
          const updated = [...prev];
          for (const item of enriched) {
            const idx = updated.findIndex((p) => p.slug === item.slug);
            if (idx !== -1) {
              updated[idx] = item as Pokemon;
            }
          }
          return updated;
        });
      }

      setDetailsLoaded(true);
    },
    [imagePath]
  );

  useEffect(() => {
    if (rawList && rawList.length > 0) {
      loadDetails(rawList);
    }
    return () => {
      abortRef.current = true;
    };
  }, [rawList, loadDetails]);

  if (loadingList) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
        Loading Pokémon...
      </div>
    );
  }

  if (listError) {
    return <ErrorCallout error={listError.message} />;
  }

  return (
    <PokemonSelector
      pokemonList={pokemonList}
      selectedSlugs={selectedSlugs}
      detailsLoaded={detailsLoaded}
      multiSelect
      onSelect={() => {}}
      onMultiSelect={(newSlugs) => {
        setValue((current) => ({
          ...current,
          newValue: {
            id: newSlugs.join(","),
          },
        }));
      }}
    />
  );
};

export default MultiPokemonDataEditor;
