import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["unpdf", "mammoth"],
  experimental: {
    // Spoken answers post their audio recording through a server action;
    // the default 1MB body limit is far too small for a few minutes of audio.
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
