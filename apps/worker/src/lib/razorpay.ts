/**
 * Razorpay integration — Payment Links + webhook signature verification.
 *
 * PANDAM never touches a card, UPI id or bank detail: a Payment Link is a
 * Razorpay-hosted checkout page (`short_url`); the buyer pays there, Razorpay
 * settles to the seller's Razorpay account (out of scope here — that is
 * standard Razorpay Route/settlement config, not something this app manages),
 * and Razorpay tells us the outcome via a webhook.
 *
 * Two things are load-bearing for money-safety:
 *  1. Every write call uses HTTP Basic auth with `RAZORPAY_KEY_SECRET` — a
 *     secret that lives only in `.dev.vars` / Worker secrets, never the client.
 *  2. `verifyWebhookSignature` is the ONLY way a payment is ever marked
 *     `paid` — see `routes/api/v1/payments.ts`. A client hitting a "confirm
 *     payment" endpoint and claiming success is never trusted.
 *
 * Plain `fetch` + Web Crypto, matching `lib/crypto.ts` — no Razorpay SDK
 * dependency, which mostly targets Node and drags in Node-specific APIs the
 * Workers runtime does not have.
 */
import { ApiError } from './http';

const RAZORPAY_API = 'https://api.razorpay.com/v1';
const encoder = new TextEncoder();

export interface RazorpayCredentials {
  keyId: string;
  keySecret: string;
}

export interface CreatePaymentLinkInput {
  /** Minor currency unit (paise for INR) — an exact integer. */
  amount: number;
  currency: string;
  description: string;
  /** Our own payment row id — round-tripped as `reference_id` and in `notes`. */
  referenceId: string;
  buyerName: string;
  buyerEmail?: string;
  /** Seconds from now the link should stay payable. */
  expiresInSeconds: number;
}

export interface RazorpayPaymentLink {
  id: string;
  short_url: string;
  status: string;
  expire_by: number | null;
}

function basicAuthHeader({ keyId, keySecret }: RazorpayCredentials): string {
  // btoa is available in the Workers runtime (and Node >= 18).
  return `Basic ${btoa(`${keyId}:${keySecret}`)}`;
}

/**
 * Create a Payment Link for one listing purchase. Throws `ApiError` (mapped to
 * a clean envelope by the route layer) on any non-2xx response — a payment
 * provider failure must never look like it silently created a valid link.
 */
export async function createPaymentLink(
  creds: RazorpayCredentials,
  input: CreatePaymentLinkInput,
): Promise<RazorpayPaymentLink> {
  const res = await fetch(`${RAZORPAY_API}/payment_links`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(creds),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      reference_id: input.referenceId,
      // No callback_url/callback_method: the buyer pays on Razorpay's hosted
      // page and sees its own confirmation — the app never depends on a
      // redirect back to itself. Truth comes from the webhook (below), and
      // the app polls `GET /api/v1/payments/:id` when the user returns to it.
      expire_by: Math.floor(Date.now() / 1000) + input.expiresInSeconds,
      customer: {
        name: input.buyerName,
        ...(input.buyerEmail ? { email: input.buyerEmail } : {}),
      },
      notify: { sms: false, email: false },
      notes: { pandamPaymentId: input.referenceId },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(
      'internal_error',
      `Razorpay could not create a payment link (${res.status}).`,
      { razorpay: [body.slice(0, 500)] },
    );
  }
  return (await res.json()) as RazorpayPaymentLink;
}

/** Cancel a still-`created` Payment Link (buyer/seller cancelled before paying). */
export async function cancelPaymentLink(
  creds: RazorpayCredentials,
  paymentLinkId: string,
): Promise<void> {
  const res = await fetch(`${RAZORPAY_API}/payment_links/${paymentLinkId}/cancel`, {
    method: 'POST',
    headers: { Authorization: basicAuthHeader(creds) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError('internal_error', `Razorpay could not cancel the payment link.`, {
      razorpay: [body.slice(0, 500)],
    });
  }
}

/**
 * Verify a Razorpay webhook body against its `X-Razorpay-Signature` header
 * using the shared `RAZORPAY_WEBHOOK_SECRET` (HMAC-SHA256 over the raw body).
 * MUST be called with the raw, unparsed request body — signing is byte-exact.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string,
): Promise<boolean> {
  if (!signatureHeader) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return timingSafeEqualHex(expected, signatureHeader.trim().toLowerCase());
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * The subset of a `payment_link.paid` / `payment_link.expired` webhook body
 * this app reads. Razorpay sends much more; everything else is ignored.
 */
export interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment_link?: { entity: { id: string; status: string } };
    payment?: { entity: { id: string; order_id: string | null } };
  };
}
