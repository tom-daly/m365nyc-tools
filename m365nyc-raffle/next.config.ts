import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — the app is entirely client-side (localStorage + in-browser
  // CSV parsing), so it can be served from any static host.
  output: "export",
  // Emit each route as <route>/index.html so plain static hosts (Azure Static
  // Web Apps) resolve /configure without needing extensionless-file rewrites.
  trailingSlash: true,
  images: {
    unoptimized: true, // Allow unoptimized images for local files
    remotePatterns: [],
    domains: [],
  },
  // Enable file watching for WSL2
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
};

export default nextConfig;
