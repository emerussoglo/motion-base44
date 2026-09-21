import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: [
    "@napi-rs/canvas",
    "@ffmpeg-installer/ffmpeg",
    "@ffprobe-installer/ffprobe",
    "fluent-ffmpeg",
    "jsdom",
  ],
  outputFileTracingExcludes: {
    "/*": ["tmp/renders/**", "tmp/**-frames/**"],
  },
};

export default nextConfig;
