# CreateWebPlace — sajt (Astro)

**Cloudflare Workers** (`@astrojs/cloudflare`) + statički assets; kontakt forma šalje mejl preko [Resend](https://resend.com/docs/send-with-astro) (`POST /api/contact`).

## Komande

```bash
npm install
npm run dev
npm run build
npm run build && npm run preview:cf   # Worker + assets (koristi poslednji build)
```

## Cloudflare (Wrangler)

- Konfiguracija: **`wrangler.jsonc`** (kompatibilnost, `nodejs_compat`, assets iz `dist/`).
- Astro posle **`npm run build`** generiše i `dist/server/wrangler.json`; `wrangler deploy` koristi spojenu konfiguraciju.
- **Workers Builds** (ili CI): npr. build `npx astro build`, deploy `npx wrangler deploy`.

## Kontakt forma i Resend

1. Resend: API ključ i verifikovan domen za **from**.
2. **Lokalno sa Astro dev:** kopiraj `.env.example` u `.env` i popuni `RESEND_API_KEY`, `CONTACT_FROM`, `CONTACT_TO`.
3. **Lokalno sa Wrangler:** iste promenljive u **`.dev.vars`** (Wrangler ne čita `.env` za Worker).
4. **Produkcija:** u Cloudflare dashboardu pod Workerom (**Settings → Variables**) ili `npx wrangler secret put RESEND_API_KEY` itd. za osetljive vrednosti; `CONTACT_FROM` / `CONTACT_TO` mogu biti kao obične varijable ako nisu tajne.

## Ostalo

`locales/` se pri `npm run dev` / `npm run build` kopira u `public/locales/` (ta fascikla je u `.gitignore`; posle klona uradi `npm install` pa `npm run dev` ili `npm run build` da se JSON ponovo iskopira).

Početna koristi `astro:assets` sa udaljenim slikama (`images.unsplash.com`); adapter koristi Cloudflare Images binding u produkciji.
