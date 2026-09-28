import React, { useState } from "react";
import { PokemonResourceSelector } from "../../components/PokemonResourceSelector";
import { buildPokemonCards, BindableType } from "../../utils/pokemonSelector";

const sprite = (path: string) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${path}`;

const CHARIZARD = {
  id: 6,
  name: { original: "charizard", formatted: "Charizard" },
  types: [
    { slot: 1, name: "fire", formatted: "Fire" },
    { slot: 2, name: "flying", formatted: "Flying" },
  ],
  stats: [
    { name: "hp", formatted: "HP", value: 78, effort: 0 },
    { name: "attack", formatted: "Attack", value: 84, effort: 0 },
    { name: "defense", formatted: "Defense", value: 78, effort: 0 },
    { name: "special-attack", formatted: "Special Attack", value: 109, effort: 3 },
    { name: "special-defense", formatted: "Special Defense", value: 85, effort: 0 },
    { name: "speed", formatted: "Speed", value: 100, effort: 0 },
  ],
  abilities: [
    { name: "blaze", formatted: "Blaze", isHidden: false, slot: 1 },
    { name: "solar-power", formatted: "Solar Power", isHidden: true, slot: 3 },
  ],
  height: 17,
  weight: 905,
  baseExperience: 267,
  sprites: {
    front_default: sprite("6.png"),
    front_shiny: sprite("shiny/6.png"),
    back_default: sprite("back/6.png"),
    back_shiny: sprite("back/shiny/6.png"),
    other: {
      "official-artwork": { front_default: sprite("other/official-artwork/6.png") },
      home: { front_default: sprite("other/home/6.png") },
      dream_world: { front_default: sprite("other/dream-world/6.svg") },
    },
  },
  species: { name: "charizard", url: "" },
  moves: [
    { name: "flamethrower", formatted: "Flamethrower" },
    { name: "fire-blast", formatted: "Fire Blast" },
    { name: "dragon-claw", formatted: "Dragon Claw" },
    { name: "air-slash", formatted: "Air Slash" },
    { name: "fly", formatted: "Fly" },
  ],
};

const PreviewPage: React.FC = () => {
  const [allowed, setAllowed] = useState<BindableType[]>([]);
  const [value, setValue] = useState("");
  const cards = buildPokemonCards(CHARIZARD);

  const toggle = (t: BindableType) =>
    setAllowed((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: 24, background: "#fafbfc", minHeight: "100vh" }}>
      <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["string", "number", "boolean", "object", "array"] as BindableType[]).map((t) => (
          <button
            key={t}
            onClick={() => toggle(t)}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              border: allowed.includes(t) ? "1px solid #007BFF" : "1px solid #ccc",
              background: allowed.includes(t) ? "#EBF5FF" : "#fff",
              cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <PokemonResourceSelector
        cards={cards}
        resolvedRoot={CHARIZARD}
        value={value}
        allowedTypes={allowed}
        resourceName="Charizard"
        onSelect={setValue}
      />
    </div>
  );
};

export default PreviewPage;
