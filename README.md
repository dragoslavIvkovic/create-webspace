# CreateWebPlace — sajt (Astro)

Statičke stranice + **Cloudflare Worker** (SSR) za API kontakt forme → [Resend](https://resend.com/docs/send-with-astro).

## Komande

```bash
npm install
npm run dev
npm run build
npm run preview   # astro build + wrangler dev (kao na Cloudflare-u)
npm run deploy    # wrangler deploy (potreban nalog Cloudflare + auth)
```

## Cloudflare / Wrangler

Projekat koristi **`@astrojs/cloudflare`** i **`wrangler.json`** (isti obrazac kao [create-webspace](https://github.com/dragoslavIvkovic/create-webspace)): posle `astro build` Wrangler koristi generisanu konfiguraciju u `dist/server/wrangler.json` (Worker ulaz + statički `dist/client` kao Assets).

Na prvom deploy-u Wrangler će ponuditi kreiranje **KV** namespace-a za Astro sesije (`SESSION` binding).

Slike sa početne koriste **compile-time** optimizaciju (`imageService: 'compile'` u adapteru), tako da ne moraš da uključuješ Cloudflare Images za ovaj projekat.

## Kontakt forma i Resend

1. Registruj se na [Resend](https://resend.com), kreiraj API ključ i verifikuj domen za **from** adresu.
2. Lokalno: kopiraj `.env.example` u `.env` (za `astro dev`).
3. Za **`wrangler dev`** / produkciju na Workers: iste promenljive stavi u **`.dev.vars`** (lokalno, ne commituj) ili u Cloudflare dashboard → Worker → **Variables** i **Secrets**:

- `RESEND_API_KEY` — tretiraj kao **Secret**
- `CONTACT_FROM` — npr. `CreateWebPlace <brief@tvoj-domen.rs>`
- `CONTACT_TO` — adresa za prijem upita

## Ostalo

`locales/` se pri `npm run dev` / `npm run build` kopira u `public/locales/` (ta fascikla je u `.gitignore`; posle klona uradi `npm install` pa `npm run dev` ili `npm run build` da se JSON ponovo iskopira).

Početna koristi optimizaciju slika (`astro:assets`). `astro.config.mjs`: `build.format: 'file'` (npr. `kontakt.html`).
