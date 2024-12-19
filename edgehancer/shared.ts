/**
 * Shared helpers for Pokemon edgehancers.
 *
 * These are inlined into each edgehancer bundle by tsup (splitting: false),
 * so there is no extra runtime dependency.
 */

export const capitalize = (str: string): string =>
  str
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/** Extract a numeric ID from a PokeAPI URL like "https://pokeapi.co/api/v2/pokemon/25/" */
export const extractIdFromUrl = (url: string): number | null => {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Transform a raw PokeAPI Pokemon response into a cleaner, more usable structure.
 * Used by both single and multi Pokemon edgehancers for consistent output.
 */
export const transformPokemon = (data: any): Record<string, any> => ({
  id: data.id,
  name: {
    original: data.name,
    formatted: capitalize(data.name),
  },
  types: (data.types || []).map((t: any) => ({
    slot: t.slot,
    name: t.type.name,
    formatted: capitalize(t.type.name),
  })),
  stats: (data.stats || []).map((s: any) => ({
    name: s.stat.name,
    formatted: capitalize(s.stat.name),
    value: s.base_stat,
    effort: s.effort,
  })),
  abilities: (data.abilities || []).map((a: any) => ({
    name: a.ability.name,
    formatted: capitalize(a.ability.name),
    isHidden: a.is_hidden,
    slot: a.slot,
  })),
  height: data.height,
  weight: data.weight,
  baseExperience: data.base_experience,
  sprites: data.sprites,
  species: data.species,
  moves: (data.moves || []).map((m: any) => ({
    name: m.move.name,
    formatted: capitalize(m.move.name),
  })),
  cries: data.cries,
});
