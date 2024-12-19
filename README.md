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
│   ├── PokemonSelector   # Pokemon picker with search, type filters, drag-to-reorder, detail panel
│   ├── ResourceSelector  # Generic resource picker with keyboard navigation
│   └── ErrorCallout      # Error display component
├── constants/            # PokeAPI endpoints and sprite URL helpers
├── edgehancer/           # Edge data transformation hooks
│   ├── request.ts        # Single Pokemon transform
│   ├── request-multi.ts  # Multi Pokemon (single list fetch + filter)
│   ├── request-generic.ts# Generic resource transform
│   └── shared.ts         # Shared helpers: capitalize, extractIdFromUrl, transformPokemon (inlined by tsup)
├── pages/                # Next.js pages
│   ├── settings.tsx      # Integration settings
│   ├── data-connection-editor.tsx # Connection config
│   └── data-types/       # Type editors and data editors
├── utils/                # Shared utility functions
└── styles/               # Global CSS (Tailwind v4)
```

## Tech Stack

- Next.js 16 with Turbopack
- React 19
- Tailwind CSS v4
- Uniform Mesh SDK (`@uniformdev/mesh-sdk-react`, `@uniformdev/mesh-edgehancer-sdk`)
- TypeScript 5.9
- tsup (edgehancer bundling)
