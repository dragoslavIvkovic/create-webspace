// @ts-check
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

// https://astro.build/config — Cloudflare Workers + static assets (full-stack deploy)
export default defineConfig({
  site: 'https://createwebplace.rs',
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  compressHTML: true,
  build: {
    format: 'file',
    assets: '_astro',
  },
  image: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
});
