// @ts-check
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://createwebplace.com',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    // Compile-time image optimization — avoids requiring Cloudflare Images (IMAGES binding) in prod.
    imageService: 'compile',
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
