/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly RESEND_API_KEY?: string;
  readonly CONTACT_FROM?: string;
  readonly CONTACT_TO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
