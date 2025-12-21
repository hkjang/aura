import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Use SSR mode instead of static export to avoid prerendering issues
  output: 'standalone',
  
  // Skip static prerendering for dynamic pages
  experimental: {
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default withNextIntl(nextConfig);
