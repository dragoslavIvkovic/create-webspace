# CreateWebPlace — sajt (Astro)

Statički prikaz stranica + **Node server** za API (kontakt forma → [Resend](https://resend.com/docs/send-with-astro)).

## Komande

```bash
npm install
npm run dev
npm run build
npm run preview   # lokalno testiranje SSR + statike kao u produkciji
```

## Kontakt forma i Resend

1. Registruj se na [Resend](https://resend.com), kreiraj API ključ i verifikuj domen za **from** adresu.
2. Kopiraj `.env.example` u `.env` i popuni:

- `RESEND_API_KEY` — API ključ
- `CONTACT_FROM` — npr. `CreateWebPlace <brief@tvoj-domen.rs>` (mora biti sa verifikovanog domena)
- `CONTACT_TO` — adresa na koju stižu upiti

3. U produkciji mora da radi **Node proces** (ne čist statički CDN bez proxy-ja), npr.:

```bash
node dist/server/entry.mjs
```

Statički fajlovi su u `dist/client/`; server ih servira zajedno sa rutom **`POST /api/contact`**.

## Ostalo

`locales/` se pri `npm run dev` / `npm run build` kopira u `public/locales/`.

Početna koristi optimizaciju slika (`astro:assets`). `astro.config.mjs`: `build.format: 'file'` (npr. `kontakt.html`).
