import React from "react";
import { useMeshLocation, LoadingOverlay } from "@uniformdev/mesh-sdk-react";

import { PokemonSelector } from "../../components/PokemonSelector";
import { useAsync } from "react-use";
import { ErrorCallout } from "../../components/ErrorCallout";
import { PokemonTypeConfig } from "./single-pokemon-type-editor";
import {
  DEFAULT_IMAGE_PATH,
  POKEAPI_BASE_URL,
  POKEAPI_POKEMON_ENDPOINT,
  POKEAPI_POKEMON_ENDPOINT_QUERY,
} from "../../constants/pokeapi";

const DataEditorInner: React.FC = () => {
  const { value, metadata, setValue } = useMeshLocation<"dataResource">();

  const custom = metadata.dataType as unknown as PokemonTypeConfig;
  const imagePath = custom?.custom?.imagePath || DEFAULT_IMAGE_PATH;

  const id = value?.id;

  const {
    value: pokemonList = [],
    loading: loadingPokemon,
    error: pokemonError,
  } = useAsync(async () => {
    const response = await fetch(
      `${POKEAPI_BASE_URL}${POKEAPI_POKEMON_ENDPOINT}${POKEAPI_POKEMON_ENDPOINT_QUERY}`
    );

    const data = await response.json();

    // Map Pokémon data to include all necessary fields
    return await Promise.all(
      data.results.map(
        async (pokemon: { name: string; url: string }, index: number) => {
          const detailResponse = await fetch(pokemon.url);
          const detailData = await detailResponse.json();

          return {
            id: index + 1,
            name: capitalize(pokemon.name), // Capitalize the name
            image: getValueFromPath(detailData, imagePath), // Use imagePath to get image
            types: detailData.types.map((t: any) => capitalize(t.type.name)),
            height: detailData.height * 10, // Convert height to cm
            weight: detailData.weight / 10, // Convert weight to kg
            abilities: detailData.abilities.map((a: any) =>
              capitalize(a.ability.name)
            ),
          };
        }
      )
    );
  }, []);

  const selectedIds = id ? [id] : [];

  if (loadingPokemon) {
    return <LoadingOverlay isActive />;
  }

  if (pokemonError) {
    return <ErrorCallout error={pokemonError.message} />;
  }

  return (
    <PokemonSelector
      pokemonList={pokemonList || []}
      imagePath={imagePath}
      selectedIds={selectedIds.map(String)}
      onSelect={(selectedPokemon) => {
        setValue((current) => ({
          ...current,
          newValue: {
            id: selectedPokemon.id.toString(),
          },
        }));
      }}
    />
  );
};

const capitalize = (name: string) =>
  name.charAt(0).toUpperCase() + name.slice(1);

const getValueFromPath = (obj: any, path: string): string | undefined => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

export default DataEditorInner;
