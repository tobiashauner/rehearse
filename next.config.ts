import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["unpdf", "mammoth"],
  experimental: {
    // Spoken answers now upload straight to Supabase Storage from the browser,
    // so no large body flows through a Server Action. The remaining upload
    // path (resume/document import) stays well under Vercel's hard 4.5MB
    // Server Action body cap, which no config value here can raise.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
