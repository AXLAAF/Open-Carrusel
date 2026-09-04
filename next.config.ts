import type { NextConfig } from "next";
import path from "path";
import { existsSync } from "fs";

/**
 * Next/Turbopack infers a workspace root by walking up lockfiles.
 * If that root lands on the parent folder (Projects/), `@import "tailwindcss"`
 * resolves there, misses node_modules, and retries in a process-spawning loop.
 */
function projectRoot(): string {
  const here = typeof __dirname === "string" ? __dirname : process.cwd();
  for (const dir of [process.cwd(), here]) {
    if (existsSync(path.join(dir, "node_modules", "tailwindcss", "package.json"))) {
      return path.resolve(dir);
    }
  }
  return path.resolve(process.cwd());
}

const root = projectRoot();
const tailwind = path.join(root, "node_modules", "tailwindcss");

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "archiver", "puppeteer", "@cursor/sdk"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  outputFileTracingRoot: root,
  turbopack: {
    root,
    resolveAlias: {
      tailwindcss: tailwind,
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string | string[]> | undefined),
      tailwindcss: tailwind,
    };
    config.context = root;
    return config;
  },
  async headers() {
    return [
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "frame-src 'self' blob:",
              "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
