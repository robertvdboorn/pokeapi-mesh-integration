import React, { useEffect, useState } from "react";
import {
  DataResourceDynamicInputProvider,
  DataResourceVariablesList,
  useMeshLocation,
} from "@uniformdev/mesh-sdk-react";
import { PokemonTypeConfig } from "./pokemon-by-name-type-editor";
import {
  POKEAPI_BASE_URL,
  POKEAPI_POKEMON_ENDPOINT,
  getOfficialArtworkUrl,
} from "../../constants/pokeapi";
import { capitalize, getValueFromPath } from "../../utils/format";

// --- Pokemon preview data ---

interface PokemonPreview {
  id: number;
  name: string;
  image: string;
  types: string[];
  height: number; // cm
  weight: number; // kg
}

// --- Resolved Pokemon Preview Panel ---

const ResolvedPokemonPanel: React.FC<{ pokemon: PokemonPreview }> = ({
  pokemon,
}) => (
  <div
    style={{
      padding: "10px",
      backgroundColor: "#f9fafb",
      borderRadius: "6px",
      border: "1px solid #e5e7eb",
    }}
  >
    <div
      style={{
        fontSize: "0.68em",
        fontWeight: 600,
        color: "#10B981",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: "6px",
      }}
    >
      Resolved Pokémon
    </div>
    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
      {pokemon.image && (
        <img
          src={pokemon.image}
          alt={pokemon.name}
          width={64}
          height={64}
          style={{
            objectFit: "contain",
            borderRadius: "8px",
            backgroundColor: "#fff",
            border: "1px solid #eee",
            flexShrink: 0,
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{ fontWeight: "bold", fontSize: "0.95em", marginBottom: "4px" }}
        >
          {pokemon.name}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "4px",
            flexWrap: "wrap",
          }}
        >
          {pokemon.types.map((type) => (
            <span
              key={type}
              style={{
                display: "inline-block",
                backgroundColor: "#e0f2fe",
                color: "#0369a1",
                border: "1px solid #bae6fd",
                padding: "1px 6px",
                borderRadius: "10px",
                fontSize: "0.75em",
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {type}
            </span>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            fontSize: "0.78em",
            color: "#555",
          }}
        >
          <span>
            <strong>ID:</strong> #{pokemon.id}
          </span>
          <span>
            <strong>Height:</strong> {pokemon.height} cm
          </span>
          <span>
            <strong>Weight:</strong> {pokemon.weight} kg
          </span>
        </div>
      </div>
    </div>
  </div>
);

// --- Inner editor ---

const PokemonByNameDataEditorInner: React.FC = () => {
  const { value, setValue, metadata } = useMeshLocation<"dataResource">();

  const name = (value?.name as string) || "";
  const isDynamic = name.includes("${");

  const custom = metadata.dataType as unknown as PokemonTypeConfig;
  const imagePath = custom?.custom?.imagePath;

  const [pokemon, setPokemon] = useState<PokemonPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Fetch Pokemon preview when a static name is entered
  useEffect(() => {
    if (!name || isDynamic) {
      setPokemon(null);
      setNotFound(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setNotFound(false);
    setPokemon(null);

    fetch(`${POKEAPI_BASE_URL}${POKEAPI_POKEMON_ENDPOINT}/${name.toLowerCase()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const img =
          (imagePath && getValueFromPath(data, imagePath)) ||
          getOfficialArtworkUrl(data.id);
        setPokemon({
          id: data.id,
          name: capitalize(data.name),
          image: img,
          types: (data.types ?? []).map((t: any) => capitalize(t.type.name)),
          height: data.height * 10,
          weight: data.weight / 10,
        });
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPokemon(null);
        setNotFound(true);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [name, isDynamic, imagePath]);

  return (
    <div>
      {/* Standard variable inputs with "Insert variable" binding */}
      <DataResourceVariablesList setVariables={setValue} />

      {/* Preview when a static name resolves */}
      {!isDynamic && name && isLoading && (
        <div
          style={{
            fontSize: "0.78em",
            color: "#666",
            padding: "6px 10px",
            backgroundColor: "#f0f4ff",
            borderRadius: "5px",
            marginTop: "8px",
          }}
        >
          Looking up Pokémon...
        </div>
      )}

      {pokemon && (
        <div style={{ marginTop: "8px" }}>
          <ResolvedPokemonPanel pokemon={pokemon} />
        </div>
      )}

      {!isDynamic && name && !isLoading && notFound && (
        <div
          style={{
            fontSize: "0.78em",
            color: "#EF4444",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            padding: "6px 10px",
            borderRadius: "5px",
            marginTop: "8px",
          }}
        >
          No Pokémon found with name &quot;{name}&quot;
        </div>
      )}
    </div>
  );
};

// --- Exported editor with required providers ---

const PokemonByNameDataEditor: React.FC = () => (
  <DataResourceDynamicInputProvider>
    <PokemonByNameDataEditorInner />
  </DataResourceDynamicInputProvider>
);

export default PokemonByNameDataEditor;
