import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone", // Ajoute le mode standalone pour optimiser l'image Docker

  // Proxy API calls to backend when running in unified container
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.NEXT_PUBLIC_BACKEND_URL
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/:path*`
          : "http://localhost:8082/:path*",
      },
    ];
  },
};

export default nextConfig;
