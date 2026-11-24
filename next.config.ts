import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permet `npm run check:build` sans écraser le cache d'un `npm run dev` en cours.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
