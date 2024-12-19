/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
