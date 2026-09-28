const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This repo sits next to other apps that have their own lockfiles. Without
  // an explicit root, Next resolves CSS imports from MESH-LATEST and cannot
  // find tailwindcss.
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
  },
  // The Uniform SDK imports @react-icons/all-files without .js extensions,
  // which breaks Node ESM resolution in Next 16. Transpiling these packages
  // bundles them into the app so the extensionless imports resolve correctly.
  transpilePackages: [
    "@uniformdev/mesh-sdk-react",
    "@uniformdev/design-system",
    "@react-icons/all-files",
    "@dnd-kit/core",
    "@dnd-kit/sortable",
    "@dnd-kit/utilities",
  ],
};

module.exports = nextConfig;
