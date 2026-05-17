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

Izvor istine za Astro + Workers (build → deploy) je Cloudflare vodič: **[Astro na Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/)**. Tamo za **on-demand / SSR** stoji:

1. Adapter `@astrojs/cloudflare`
2. **`public/.assetsignore`** sa `_worker.js` i `_routes.json`
3. Wrangler sa `compatibility_flags: ["nodejs_compat"]`, **`assets`** (`binding` + **`directory`** — mora da pokazuje na folder sa statikom), **`observability`**, po želji **`not_found_handling`: `404-page`** ([custom 404](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/#custom-404-pages))
4. **`npx astro build`** pa **`npx wrangler deploy`** (ili [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/#workers-builds): build + deploy komande)

**Razlika u odnosu na primer u tom članku:** dokumentacija još koristi `main: ./dist/_worker.js/index.js` i `assets.directory: ./dist`. Kod **Astro 6 / `@astrojs/cloudflare` v13+** statika je u **`dist/client/`**, zato je ovde **`assets.directory`**: `"./dist/client"`. Polje **`main` se ne duplira u `wrangler.jsonc`**: ako ga dodamo kao `./dist/server/entry.mjs`, **`astro build` pada** jer Vite proverava `main` pre nego što se `entry.mjs` generiše. Ulaz Workera i dalje dolazi iz spoja sa **`dist/server/wrangler.json`** posle builda (to radi `wrangler deploy`).

### Cloudflare Pages (Build command: `npm run build`)

Ako u dashboardu koristiš **samo** build bez `wrangler deploy`, obavezno podesi **Build output directory** na **`dist/client`**, ne na `dist`. Adapter `@astrojs/cloudflare` stavlja `index.html` i statiku u `dist/client/`; ako Pages objavi koren `dist/`, korena stranica je **404**.

Upozorenje u logu tipa _Wrangler configuration file was found but it does not appear to be valid … `pages_build_output_dir`_ je normalno: `wrangler.jsonc` ovde je namenjen **Worker** deployu, ne „čistom“ Pages manifestu. Dok god je u UI-ju izlaz **`dist/client`**, statički sajt će biti ispravan.

**Nemoj** dodavati `pages_build_output_dir` u `wrangler.jsonc` samo da ućutkaš tu poruku: pri `astro build` Wrangler onda tretira projekat kao Pages i prijavi grešku da je ime **`ASSETS`** rezervisano za Pages (_The name 'ASSETS' is reserved in Pages projects_).

Na čistom Pages deployu bez Workera **`POST /api/contact` neće raditi** — za to treba **Workers Builds** sa _Deploy command_ `npx wrangler deploy` ili zaseban Worker projekat.

### Repo (kratko)

- **`wrangler.jsonc`**: validan JSON (bez završnih zareza u objektu); usklađeno sa [manual SSR delom](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/#if-your-site-uses-on-demand-rendering) uz **`assets.directory` → `./dist/client`**.
- **`public/.assetsignore`**: linije iz vodiča (`_worker.js`, `_routes.json`).
- **Astro deploy** (pored Cloudflare): [Deploy your Astro Site to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/).

## Kontakt forma i Resend

1. Resend: API ključ i verifikovan domen za **from**.
2. **Lokalno sa Astro dev:** kopiraj `.env.example` u `.env` i popuni `RESEND_API_KEY`, `CONTACT_FROM`, `CONTACT_TO`.
3. **Lokalno sa Wrangler:** iste promenljive u **`.dev.vars`** (Wrangler ne čita `.env` za Worker).
4. **Produkcija:** u Cloudflare dashboardu pod Workerom (**Settings → Variables**) ili `npx wrangler secret put RESEND_API_KEY` itd. za osetljive vrednosti; `CONTACT_FROM` / `CONTACT_TO` mogu biti kao obične varijable ako nisu tajne.

## Ostalo

`locales/` se pri `npm run dev` / `npm run build` kopira u `public/locales/` (ta fascikla je u `.gitignore`; posle klona uradi `npm install` pa `npm run dev` ili `npm run build` da se JSON ponovo iskopira).

Početna koristi `astro:assets` sa udaljenim slikama (`images.unsplash.com`); adapter koristi Cloudflare Images binding u produkciji.
