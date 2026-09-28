import React, { useMemo } from "react";
import { useMeshLocation } from "@uniformdev/mesh-sdk-react";

import { PokemonResourceSelector } from "../../../components/PokemonResourceSelector";
import { buildPokemonCards, BindableType } from "../../../utils/pokemonSelector";

/**
 * Data Resource Selector location for the Pokémon archetypes.
 *
 * Replaces Uniform's default raw JSON tree when an author connects a parameter or
 * field to a value inside a resolved Pokémon data resource. Because the edgehancer
 * output shape is known (see edgehancer/shared.ts → transformPokemon), we present a
 * curated, previewable picker instead of exposing raw JSON.
 */
const PokemonDataResourceSelector: React.FC = () => {
  const { value, setValue, metadata, isReadOnly } = useMeshLocation("dataResourceSelector");

  const resolved = metadata.dataResourceValue;
  const allowedTypes = (metadata.allowedTypes ?? []) as BindableType[];

  const cards = useMemo(() => buildPokemonCards(resolved), [resolved]);

  const handleSelect = (pointer: string) => {
    if (isReadOnly) return;
    setValue(() => ({ newValue: pointer }));
  };

  if (!resolved || typeof resolved !== "object" || cards.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
        No resolved Pokémon data is available yet. Save the data resource, then reopen
        the connection panel to pick a field.
      </div>
    );
  }

  return (
    <PokemonResourceSelector
      cards={cards}
      resolvedRoot={resolved}
      value={value ?? ""}
      allowedTypes={allowedTypes}
      resourceName={metadata.dataResourceName}
      isReadOnly={isReadOnly}
      onSelect={handleSelect}
    />
  );
};

export default PokemonDataResourceSelector;
