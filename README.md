# PokeAPI Integration for Uniform

A custom Mesh integration that connects the [PokeAPI](https://pokeapi.co/) with Uniform's composable DXP. Supports single Pokemon, multi-Pokemon, and generic resource archetypes with progressive loading, rich selectors, and server-side data transformation via edgehancers.

## Features

- **Single Pokemon** — Browse and select a Pokemon with full detail preview (types, stats, abilities, sprites)
- **Multiple Pokemon** — Multi-select Pokemon with drag-to-reorder chips and batch removal
- **Generic Resource** — Fetch any PokeAPI resource endpoint (berries, types, moves, etc.)
- **Progressive Loading** — Lightweight list loads instantly, detail data loads in background batches
- **Type Filter Pills** — Filter by all 18 Pokemon types
- **Search** — Filter by name or Pokedex number
- **Keyboard Navigation** — Arrow keys, Enter, and Escape support
- **Rich Detail Panel** — Types, stats, abilities, sprites, and species info
- **Friendly Dynamic Token Picker** — A curated [Data Resource Selector](#data-resource-selector) replaces Uniform's raw JSON tree with sprite thumbnails, type pills, and stat bars
- **Edgehancers** — Server-side data transformation with consistent output structure

## Data Archetypes

| Archetype | Description | Edgehancer |
|-----------|-------------|------------|
| `singlePokemon` | Fetches a single Pokemon by name/ID | `request.ts` |
| `multiplePokemon` | Filters the PokeAPI list to selected Pokemon (single fetch) | `request-multi.ts` |
| `genericResource` | Fetches any PokeAPI resource with name formatting | `request-generic.ts` |

## Edgehancers

| Hook | Purpose |
|------|---------|
| `request.ts` | Transforms a single Pokemon response: structured name, types, stats, abilities, height, weight, sprites, moves, cries |
| `request-multi.ts` | Calls the **pokeapi-proxy** batch endpoint (1 subrequest) for full transformed data per Pokemon |
| `request-generic.ts` | Minimal transform: capitalizes name fields and formats names arrays |

`request.ts` uses the `transformPokemon` function from `edgehancer/shared.ts` for rich single-Pokemon data. `request-multi.ts` delegates to the [pokeapi-proxy](../pokeapi-proxy/) service which handles caching (Upstash Redis), name resolution, and parallel fetching — keeping the edgehancer thin (1 subrequest).

### Multi-select data output

Each Pokemon in the multi-select response includes the full `transformPokemon` output (same shape as the single-Pokemon edgehancer):

```json
{
  "id": 1,
  "name": { "original": "bulbasaur", "formatted": "Bulbasaur" },
  "types": [{ "slot": 1, "name": "grass", "formatted": "Grass" }],
  "stats": [{ "name": "hp", "formatted": "Hp", "value": 45, "effort": 0 }],
  "abilities": [{ "name": "overgrow", "formatted": "Overgrow", "isHidden": false, "slot": 1 }],
  "sprites": { "front_default": "...", "front_shiny": "..." },
  "height": 7,
  "weight": 69
}
```

### Proxy vs direct mode

The multi-Pokemon edgehancer supports two modes, selected at **build time**:

| Mode | When | Data shape | Subrequests |
|------|------|------------|-------------|
| **Direct** (default) | `POKEAPI_PROXY_URL` not set | Lightweight (id, name, sprites) | 1 (PokeAPI list) |
| **Proxy** | `POKEAPI_PROXY_URL` set | Full `transformPokemon` output | 1 (proxy batch) |

The proxy URL is injected at build time via tsup `define` — it's baked into the bundle, so no secrets leak at runtime.

```bash
# Build with proxy enabled (your private domain stays in the bundle, not in source)
POKEAPI_PROXY_URL=https://your-proxy.example.com pnpm edgehancer:build

# Build without proxy (open-source default — direct PokeAPI)
pnpm edgehancer:build
```

See the [pokeapi-proxy README](../pokeapi-proxy/README.md) for proxy setup and deployment.

## Data Resource Selector

When an author connects a parameter or field to a dynamic token, Uniform normally shows the **raw JSON tree** of the resolved data resource. Because we already know the exact shape of our edgehancer output (`transformPokemon`), we replace that tree with a curated, domain-specific picker — authors never have to read JSON.

The selector (`pages/data/selector/pokemon.tsx`) is wired to the `singlePokemon`, `multiplePokemon`, and `pokemonByName` archetypes via `dataResourceSelectorUrl` in the manifest. It surfaces only meaningful fields, grouped and previewed:

| Group | What you can pick | JSON pointer example |
|-------|-------------------|----------------------|
| Identity | Display name, API name, Pokédex number, species | `/name/formatted`, `/id` |
| Images | Sprite thumbnails (official artwork, front/back, shiny…) rendered inline | `/sprites/other/official-artwork/front_default` |
| Types | Color-coded, clickable type pills | `/types/0/formatted` |
| Measurements | Height, weight, base experience | `/height` |
| Base stats | Each stat with a value bar | `/stats/0/value` |
| Abilities | Ability chips (hidden abilities flagged) | `/abilities/0/formatted` |
| Moves | Move chips (capped, plus the full list) | `/moves/0/formatted` |

Highlights:

- **No raw JSON** — only previewable, labelled fields from the known edgehancer output.
- **Category tabs** — quick filter by **All / Text / Numbers / Images / Lists / Yes-no / Objects**, each with a live count. Only categories that actually have fields are shown, and tabs stay in sync with the type filter and search.
- **Type-aware filtering** — uses `metadata.allowedTypes` to show only fields whose value type (`string`/`number`/`boolean`/`object`/`array`) is valid for the target. A "Show all fields" toggle overrides it.
- **Actionable selection summary** — the current selection shows its friendly label (e.g. "Front · shiny in Images"), an image thumbnail when relevant, the resolved value, the JSON pointer, and a one-click **Clear**.
- **Type-themed UI** — hero artwork and stat bars are tinted by the Pokémon's primary type.
- **Multi-aware** — when resolving the `multiplePokemon` archetype (an array), each Pokémon is rendered as its own card with index-prefixed pointers (`/0/...`, `/1/...`).
- **Search** — fuzzy match across field labels and pointers.

> The `genericResource` archetype intentionally keeps Uniform's default JSON tree, since its output shape is arbitrary (any PokeAPI endpoint) and therefore not known ahead of time.

Requires `@uniformdev/mesh-sdk` **20.66.1+** (Data Resource Selector is in developer preview). See the [Uniform docs](https://docs.uniform.app/docs/integrations/mesh-integrations/locations/data-resource-selector).

## Configuration

Add an external integration in the Uniform dashboard and use the following for the `Mesh App Manifest` field:

- Local: [mesh-manifest.local.json](./mesh-manifest.local.json)
- Vercel: [mesh-manifest.vercel.json](./mesh-manifest.vercel.json)

## Setup

```bash
pnpm install
pnpm dev
```

Runs on port **4063**.

## Build & Deploy Edgehancers

```bash
# Build all edgehancers
pnpm edgehancer:build

# Deploy all edgehancers
pnpm deploy-edgehancer

# Remove all edgehancers
pnpm remove-edgehancer
```

## Project Structure

```
├── components/           # React UI components
│   ├── PokemonSelector        # Pokemon picker with search, type filters, drag-to-reorder, detail panel
│   ├── ResourceSelector       # Generic resource picker with keyboard navigation
│   ├── PokemonResourceSelector# Curated Data Resource Selector UI (sprite tiles, type pills, stat bars)
│   └── ErrorCallout           # Error display component
├── constants/            # PokeAPI endpoints and sprite URL helpers
├── edgehancer/           # Edge data transformation hooks
│   ├── request.ts        # Single Pokemon transform
│   ├── request-multi.ts  # Multi Pokemon (single list fetch + filter)
│   ├── request-generic.ts# Generic resource transform
│   └── shared.ts         # Shared helpers: capitalize, extractIdFromUrl, transformPokemon (inlined by tsup)
├── pages/                # Next.js pages
│   ├── settings.tsx      # Integration settings
│   ├── data-connection-editor.tsx # Connection config
│   ├── data-types/       # Type editors and data editors
│   └── data/selector/    # Data Resource Selector location (friendly dynamic token picker)
├── utils/                # Shared utility functions (format, pokemonSelector field model)
└── styles/               # Global CSS (Tailwind v4)
```

## Tech Stack

- Next.js 16 with Turbopack
- React 19
- Tailwind CSS v4
- Uniform Mesh SDK 20.80.1 (`@uniformdev/mesh-sdk-react`, `@uniformdev/mesh-edgehancer-sdk`)
- TypeScript 5.9
- tsup (edgehancer bundling)
