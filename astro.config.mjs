// @ts-check
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://createwebplace.rs',
  adapter: node({ mode: 'standalone' }),
  compressHTML: true,
  build: {
    format: 'file',
    assets: '_astro',
  },
  image: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
});
