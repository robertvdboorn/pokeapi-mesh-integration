import React, { useState, useEffect, useMemo } from "react";
import { VerticalRhythm, Input } from "@uniformdev/design-system";

interface Pokemon {
  id: number;
  name: string;
  image?: string;
  types: string[];
  abilities: string[];
  height: number; // in cm
  weight: number; // in kg
  stats: { name: string; value: number }[];
}

interface PokemonSelectorProps {
  pokemonList: Pokemon[]; // List of Pokémon to display
  imagePath: string; // JSON path to the image (if needed)
  selectedIds: string[]; // IDs of selected Pokémon
  onSelect: (pokemon: Pokemon) => void; // Callback when a Pokémon is selected
}

const typeColors: Record<string, string> = {
  fire: "#EE8130",
  water: "#6390F0",
  grass: "#7AC74C",
  electric: "#F7D02C",
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
  normal: "#A8A77A",
};

const highlightQuery = (name: string, query: string): React.ReactNode => {
  if (!query) return name;
  const parts = name.split(new RegExp(`(${query})`, "gi"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={index} style={{ color: "#007BFF", fontWeight: "bold" }}>
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};

interface PokemonCardProps {
  pokemon: Pokemon;
  selected: boolean;
  onSelect: (pokemon: Pokemon) => void;
  searchQuery: string;
}

const PokemonCard: React.FC<PokemonCardProps> = ({
  pokemon,
  selected,
  onSelect,
  searchQuery,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <li
      onClick={() => onSelect(pokemon)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px",
        borderRadius: "4px",
        cursor: "pointer",
        marginBottom: "8px",
        backgroundColor: hovered ? "#f7faff" : selected ? "#F0F8FF" : "#FFFFFF",
        border: selected ? "1px solid #007BFF" : "1px solid transparent",
        transition:
          "background-color 0.2s ease, border 0.2s ease, box-shadow 0.2s ease",
        boxShadow: hovered ? "0px 2px 8px rgba(0, 0, 0, 0.1)" : "none",
      }}
    >
      {pokemon.image && (
        <img
          src={pokemon.image}
          alt={pokemon.name}
          width={75}
          height={75}
          loading="lazy"
          style={{
            marginRight: "10px",
            borderRadius: "4px",
            objectFit: "cover",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://picsum.photos/75";
          }}
        />
      )}
      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: "bold", fontSize: "1.1em" }}>
          {highlightQuery(pokemon.name, searchQuery)}
        </span>
        <div style={{ fontSize: "0.85em", color: "#666", marginTop: "4px" }}>
          <div style={{ marginBottom: "8px" }}>
            {pokemon.types.map((type) => (
              <span
                key={type}
                style={{
                  display: "inline-block",
                  backgroundColor: typeColors[type.toLowerCase()] || "#ccc",
                  color: "#fff",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "0.75em",
                  marginRight: "4px",
                }}
              >
                {type}
              </span>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              gap: "8px",
              fontSize: "0.85em",
              color: "#555",
            }}
          >
            <div>
              <strong>Height:</strong> {pokemon.height} cm
            </div>
            <div>
              <strong>Weight:</strong> {pokemon.weight} kg
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export const PokemonSelector: React.FC<PokemonSelectorProps> = ({
  pokemonList = [],
  selectedIds,
  onSelect,
  imagePath,
}) => {
  // Immediate input value
  const [inputValue, setInputValue] = useState("");
  // Debounced search query used for filtering
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(inputValue);
    }, 10);
    return () => clearTimeout(handler);
  }, [inputValue]);

  const filteredPokemonList = useMemo(() => {
    if (debouncedSearchQuery.trim() === "") return pokemonList;
    return pokemonList
      .filter((pokemon) =>
        pokemon.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const startsWithA = a.name
          .toLowerCase()
          .startsWith(debouncedSearchQuery.toLowerCase());
        const startsWithB = b.name
          .toLowerCase()
          .startsWith(debouncedSearchQuery.toLowerCase());
        if (startsWithA && !startsWithB) return -1;
        if (!startsWithA && startsWithB) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [pokemonList, debouncedSearchQuery]);

  const handleSelection = (pokemon: Pokemon) => {
    onSelect(pokemon);
    setInputValue(pokemon.name);
  };

  return (
    <VerticalRhythm>
      {/* Search input with integrated clear button */}
      <div style={{ position: "relative", width: "100%" }}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Filter by name..."
          label="Search Pokémon"
          style={{ width: "100%", paddingRight: "40px" }}
        />
        {inputValue && (
          <button
            onClick={() => setInputValue("")}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              color: "#999",
            }}
            aria-label="Clear search input"
          >
            &times;
          </button>
        )}
      </div>
      <ul
        role="list"
        style={{
          maxHeight: "400px",
          overflowY: "auto",
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "8px",
          marginTop: "16px",
          listStyleType: "none",
        }}
      >
        {filteredPokemonList.length > 0 ? (
          filteredPokemonList.map((pokemon) => (
            <PokemonCard
              key={pokemon.id}
              pokemon={pokemon}
              selected={selectedIds.includes(pokemon.id.toString())}
              onSelect={handleSelection}
              searchQuery={debouncedSearchQuery}
            />
          ))
        ) : (
          <li style={{ textAlign: "center", color: "#666", padding: "20px" }}>
            No Pokémon found
          </li>
        )}
      </ul>
    </VerticalRhythm>
  );
};

export default PokemonSelector;
