/** Vrednosti moraju odgovarati Zod šemi u API ruti. */
export const CONTACT_CATEGORY_SLUGS = [
  'web-dizajn',
  'web-shop',
  'seo',
  'local-seo',
  'geo',
  'hosting',
  'google-ads',
  'google-maps',
  'graficki-dizajn',
  'digitalni-meni',
  'general',
] as const;

export type ContactCategorySlug = (typeof CONTACT_CATEGORY_SLUGS)[number];

/** Čitljive oznake u mejlu (SR). */
export const CATEGORY_LABEL_SR: Record<ContactCategorySlug, string> = {
  'web-dizajn': 'Web dizajn i UX/UI',
  'web-shop': 'Web shop / e‑commerce',
  seo: 'SEO optimizacija',
  'local-seo': 'Local SEO',
  geo: 'Google Business / GEO',
  hosting: 'Hosting i održavanje',
  'google-ads': 'Google Ads',
  'google-maps': 'Google Maps / GMB',
  'graficki-dizajn': 'Grafički dizajn',
  'digitalni-meni': 'Digitalni meni',
  general: 'Opšti upit / konsultacije',
};
