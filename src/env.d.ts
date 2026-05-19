/// <reference types="astro/client" />

declare module 'cloudflare:workers' {
  /** Vars / secrets iz Wrangler konfiguracije i dashboard-a */
  export const env: Record<string, string | undefined>;
}

interface ImportMetaEnv {
  readonly RESEND_API_KEY?: string;
  readonly CONTACT_FROM?: string;
  readonly CONTACT_TO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
