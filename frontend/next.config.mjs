/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "/RE-DAY",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
