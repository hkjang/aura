import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Skip static prerendering for all pages
  // This allows the build to succeed while pages are rendered at request time
  experimental: {
    // Disable static page generation for pages with DB dependencies
  }
};

export default withNextIntl(nextConfig);
