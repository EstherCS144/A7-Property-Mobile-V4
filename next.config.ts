import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

const localDevOrigins = Object.values(networkInterfaces())
  .flatMap((interfaces) => interfaces ?? [])
  .filter((details) => details.family === "IPv4" && !details.internal)
  .map((details) => details.address);

const nextConfig: NextConfig = {
  allowedDevOrigins: localDevOrigins,
  output: process.env.CAPACITOR_BUILD === "1" ? "export" : undefined,
  images: process.env.CAPACITOR_BUILD === "1" ? { unoptimized: true } : undefined,
};

export default nextConfig;
