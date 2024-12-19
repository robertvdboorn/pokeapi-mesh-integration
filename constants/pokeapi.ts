export const DEFAULT_IMAGE_PATH =
  "sprites.other.official-artwork.front_default";
export const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";
export const POKEAPI_POKEMON_ENDPOINT = "/pokemon";
export const POKEAPI_POKEMON_ENDPOINT_LIMIT = 151;
export const POKEAPI_POKEMON_ENDPOINT_QUERY = `?limit=${POKEAPI_POKEMON_ENDPOINT_LIMIT}`;

/** Extract the Pokemon ID from a PokeAPI resource URL (e.g. "https://pokeapi.co/api/v2/pokemon/25/" → 25) */
export const extractIdFromUrl = (url: string): number => {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? parseInt(match[1], 10) : 0;
};

/** Build the official artwork URL for a given Pokemon ID */
export const getOfficialArtworkUrl = (id: number): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

/** All supported PokeAPI named endpoints with their display names and default list limits */
export const POKEAPI_ENDPOINTS: {
  value: string;
  label: string;
  limit: number;
}[] = [
  { value: "pokemon", label: "Pokemon", limit: 151 },
  { value: "berry", label: "Berry", limit: 64 },
  { value: "type", label: "Type", limit: 20 },
  { value: "ability", label: "Ability", limit: 300 },
  { value: "move", label: "Move", limit: 900 },
  { value: "item", label: "Item", limit: 300 },
  { value: "nature", label: "Nature", limit: 25 },
  { value: "location", label: "Location", limit: 850 },
  { value: "region", label: "Region", limit: 10 },
  { value: "generation", label: "Generation", limit: 10 },
  { value: "egg-group", label: "Egg Group", limit: 15 },
  { value: "pokemon-species", label: "Pokemon Species", limit: 151 },
];