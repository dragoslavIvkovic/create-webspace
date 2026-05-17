# CreateWebPlace — sajt (Astro)

**Cloudflare Workers** (`@astrojs/cloudflare`) + statički assets; kontakt forma šalje mejl preko [Resend](https://resend.com/docs/send-with-astro) (`POST /api/contact`).

## Komande

```bash
npm install
npm run dev
npm run build
npm run build && npm run preview:cf   # lokalni Worker (koristi poslednji build)
npm run build && npm run deploy:cf   # produkcija (Wrangler upload)
```

## Cloudflare (Wrangler)

Zvanični tok: [Deploy your Astro Site to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/) i [Astro na Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/). Oba koriste **Workers** + **`npx astro build`** zatim **`npx wrangler deploy`** (u CI: odvojene _Build_ i _Deploy_ komande).

Napomena: u Cloudflare vodiču za SSR još uvek stoji `main: ./dist/_worker.js/index.js`. Kod **`@astrojs/cloudflare` v13+** (Astro 6) adapter posle builda generiše **`dist/server/entry.mjs`** i **`dist/server/wrangler.json`** — ne dodaje se ručno `main` u korenskom `wrangler.jsonc`; Wrangler pri deployu koristi spojenu konfiguraciju.

- Konfiguracija: **`wrangler.jsonc`** — mora biti **validan JSON** (bez završnih zareza na poslednjem polju u objektu). Posebno strogi parseri (npr. Wrangler na starijem Pages build alatu) inače javljaju `ParseError: PropertyNameExpected`.
- **`public/.assetsignore`**: po Cloudflare upustvu (`_worker.js`, `_routes.json`) da se ti artefakti ne tretiraju kao statički asset ako se pojave u izlazu.
- Astro posle **`npm run build`** generiše `dist/client/` (assets), `dist/server/` (Worker) i `dist/server/wrangler.json`; pravi deploy je **`npx wrangler deploy`**, koji spaja tvoj `wrangler.jsonc` sa generisanom konfiguracijom.
- **Workers Builds** (preporuka iz [Astro deploy](https://docs.astro.build/en/guides/deploy/cloudflare/)): _Build command_ `npx astro build`, _Deploy command_ `npx wrangler deploy`. Bez deploy koraka Cloudflare **objavi samo statičke fajlove** (nema `POST /api/contact` ni SSR handlera).
- Lokalno pun tok: `npm run build && npm run deploy:cf` (vidi `package.json`).

## Kontakt forma i Resend

1. Resend: API ključ i verifikovan domen za **from**.
2. **Lokalno sa Astro dev:** kopiraj `.env.example` u `.env` i popuni `RESEND_API_KEY`, `CONTACT_FROM`, `CONTACT_TO`.
3. **Lokalno sa Wrangler:** iste promenljive u **`.dev.vars`** (Wrangler ne čita `.env` za Worker).
4. **Produkcija:** u Cloudflare dashboardu pod Workerom (**Settings → Variables**) ili `npx wrangler secret put RESEND_API_KEY` itd. za osetljive vrednosti; `CONTACT_FROM` / `CONTACT_TO` mogu biti kao obične varijable ako nisu tajne.

## Ostalo

`locales/` se pri `npm run dev` / `npm run build` kopira u `public/locales/` (ta fascikla je u `.gitignore`; posle klona uradi `npm install` pa `npm run dev` ili `npm run build` da se JSON ponovo iskopira).

Početna koristi `astro:assets` sa udaljenim slikama (`images.unsplash.com`); adapter koristi Cloudflare Images binding u produkciji.
