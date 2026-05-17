import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { z } from 'zod';
import {
  CONTACT_CATEGORY_SLUGS,
  CATEGORY_LABEL_SR,
  type ContactCategorySlug,
} from '../../lib/contact-categories';

export const prerender = false;

const schema = z.object({
  name: z.string().min(2).max(120).trim(),
  email: z.string().email().trim(),
  phone: z.string().max(40).trim().optional().default(''),
  category: z.enum(CONTACT_CATEGORY_SLUGS),
  message: z.string().min(10).max(8000).trim(),
  source: z.string().max(120).optional().default(''),
  /** Honeypot — mora ostati prazno (ne koristiti ime koje browser/autofill mapira na posao firmu). */
  cwp_hp: z.string().max(100).optional().default(''),
});

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function nl2br(s: string) {
  return escapeHtml(s).replaceAll('\n', '<br />');
}

/** Resend expects `email@x` or `Name <email@x>`. Cloudflare vars sometimes drop the trailing `>`. */
function normalizeResendFrom(from: string): string {
  const s = from.trim();
  if (!s) return s;
  if (s.includes('<') && !s.includes('>')) return `${s}>`;
  return s;
}

function buildEmailHtml(payload: z.infer<typeof schema>) {
  const catLabel = CATEGORY_LABEL_SR[payload.category as ContactCategorySlug];
  const rows: [string, string][] = [
    ['Kategorija', escapeHtml(catLabel)],
    ['Ime i prezime', escapeHtml(payload.name)],
    ['Email', escapeHtml(payload.email)],
  ];
  if (payload.phone) rows.push(['Telefon', escapeHtml(payload.phone)]);
  if (payload.source) rows.push(['Stranica / kontekst', escapeHtml(payload.source)]);
  rows.push(['Poruka', nl2br(payload.message)]);

  const body = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:600;color:#0f172a;width:170px">${escapeHtml(k)}</td><td style="padding:10px 14px;border-bottom:1px solid #eee;color:#334155">${v}</td></tr>`,
    )
    .join('');

  return `<!doctype html><html><body style="margin:0;font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;padding:24px">
  <table role="presentation" style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,.08)">
    <tr><td style="padding:28px 28px 12px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#f8fafc">
      <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.85">CreateWebPlace</div>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:700">Novi upit sa sajta</h1>
    </td></tr>
    <tr><td style="padding:8px 0"><table role="presentation" style="width:100%;border-collapse:collapse">${body}</table></td></tr>
    <tr><td style="padding:16px 28px 24px;font-size:12px;color:#64748b">Odgovorite direktno na ovaj mejl — Reply ide na adresu klijenta.</td></tr>
  </table></body></html>`;
}

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json') {
    return new Response(JSON.stringify({ ok: false, error: 'Unsupported media type' }), {
      status: 415,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ ok: false, error: 'validation', issues: parsed.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const input = parsed.data;
  if (input.cwp_hp && input.cwp_hp.trim().length > 0) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const key = import.meta.env.RESEND_API_KEY;
  const from = normalizeResendFrom(import.meta.env.CONTACT_FROM ?? '');
  const to = (import.meta.env.CONTACT_TO ?? '').trim();

  if (!key || !from || !to) {
    return new Response(JSON.stringify({ ok: false, error: 'Server email not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const resend = new Resend(key);
  const catLabel = CATEGORY_LABEL_SR[input.category as ContactCategorySlug];
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: input.email,
    subject: `[Upit: ${catLabel}] ${input.name}`,
    html: buildEmailHtml(input),
    text: [
      `Kategorija: ${catLabel}`,
      `Ime: ${input.name}`,
      `Email: ${input.email}`,
      input.phone ? `Telefon: ${input.phone}` : '',
      input.source ? `Kontekst: ${input.source}` : '',
      '',
      input.message,
    ]
      .filter(Boolean)
      .join('\n'),
  });

  if (error) {
    const message =
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message
        : 'Resend send failed';
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, id: data?.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
