/* eslint-disable no-var */
import type { Options } from "tsup";

/*
 *  Configure TypeScript build with `tsup` for edgehancer code.
 *  It is NOT required to use TypeScript, or even a bundle step,
 *  but it does make it easier to consume the edgehancer SDK.
 *
 *  The requirements are:
 *  - the edgehancer hook must be in a single, bundled file
 *  - the default export of the hook file must be the hook function
 *  - the hook runs in the context of v8, so you may not use node.js libraries or APIs
 *
 *  Build-time env injection:
 *  - POKEAPI_PROXY_URL: when set, request-multi.ts uses the proxy batch endpoint
 *    instead of direct PokeAPI fetching. The value is baked into the bundle.
 *
 *  @example POKEAPI_PROXY_URL=https://pokeapi-proxy.example.com pnpm edgehancer:build
 */
export var tsup: Options = {
  format: "esm",
  target: "es2021",
  // edgehancers run in v8, which is closer to a browser than node
  platform: "browser",
  // optional
  minify: true,
  // must be a single file
  splitting: false,
  entry: [
    "./edgehancer/request.ts",
    "./edgehancer/request-multi.ts",
    "./edgehancer/request-generic.ts",
  ],
  outDir: "./edgehancer/dist",
  // force inlining of all dependencies imported
  noExternal: [new RegExp(/./)],
  // Inject env variables at build time (edgehancers have no process.env at runtime)
  define: {
    __POKEAPI_PROXY_URL__: JSON.stringify(process.env.POKEAPI_PROXY_URL || ""),
  },
};
