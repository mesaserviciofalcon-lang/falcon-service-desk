import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/simulacros/*": ["public/fflogo-pdf.jpg"],
  },
};

export default nextConfig;
