// next.config.ts
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true, // ✅ αντί για experimental.typedRoutes
};
export default nextConfig;
