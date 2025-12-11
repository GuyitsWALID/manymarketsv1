import crypto from 'crypto';

// Paddle configuration from env
const PADDLE_VENDOR_ID = process.env.PADDLE_VENDOR_ID;
const PADDLE_VENDOR_AUTH = process.env.PADDLE_VENDOR_AUTH; // vendor auth (classic) or billing key (pdl_...)
const PADDLE_PUBLIC_KEY = process.env.PADDLE_PUBLIC_KEY; // used to verify webhook signature
const PADDLE_PRO_PRODUCT_ID = process.env.PADDLE_PRO_PRODUCT_ID || 'pro';

export const PRODUCTS = { FREE: 'free', PRO: PADDLE_PRO_PRODUCT_ID } as const;

function isBillingApiKey(): boolean {
  return !!(PADDLE_VENDOR_AUTH && /pdl_(sdbx|live)_apikey_/.test(String(PADDLE_VENDOR_AUTH)));
}

function isSandbox(): boolean {
  return !!(PADDLE_VENDOR_AUTH && String(PADDLE_VENDOR_AUTH).includes('sdbx'));
}

function getVendorBaseUrl(): string {
  // Classic vendor endpoints
  return isSandbox() ? 'https://sandbox-vendors.paddle.com/api/2.0' : 'https://vendors.paddle.com/api/2.0';
}

function getBillingBaseUrl(): string {
  // Paddle Billing endpoints
  return isSandbox() ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com';
}

function getBaseUrl(): string {
  return isBillingApiKey() ? getBillingBaseUrl() : getVendorBaseUrl();
}

type PaddleResult<T> = { error: string; code?: number } | T;

// Create a checkout link. For Billing API keys, create a transaction to obtain `checkout.url`.
export async function createCheckout(params: {
  productId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  redirectUrl?: string;
}): Promise<PaddleResult<{ url: string }>> {
  if (!PADDLE_VENDOR_AUTH) return { error: 'Paddle credentials not configured' };
  try {
    if (isBillingApiKey()) {
      const priceId = await resolvePriceId(params.productId);
      if (!priceId) return { error: 'Failed to resolve price id' };
      const tx = await createTransaction({ priceId, userEmail: params.userEmail, returnUrl: params.redirectUrl });
      return tx;
    }

    // Classic vendor API using vendor id & auth
    const baseUrl = getBaseUrl();
    const payload = new URLSearchParams();
    payload.set('vendor_id', PADDLE_VENDOR_ID || '');
    payload.set('vendor_auth_code', PADDLE_VENDOR_AUTH || '');
    payload.set('product_id', params.productId);
    payload.set('passthrough', params.userId);
    if (params.userEmail) payload.set('customer_email', params.userEmail);
    if (params.redirectUrl) payload.set('return_url', params.redirectUrl);
    const endpoint = `${baseUrl}/product/generate_pay_link`;
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: payload.toString() });
    const json = await res.json();
    if (!res.ok || json?.success === false) return { error: json?.error?.message || 'Failed to generate pay link', code: json?.error?.code } as any;
    return { url: json?.response?.url || '' };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// Create a billing transaction (Paddle Billing API). Returns checkout.url in object.
export async function createTransaction(params: { priceId?: string; productId?: string; quantity?: number; userEmail?: string; returnUrl?: string; include?: string[]; }): Promise<PaddleResult<{ url: string }>> {
  if (!PADDLE_VENDOR_AUTH) return { error: 'Paddle credentials not configured' };
  if (!isBillingApiKey()) return { error: 'createTransaction is supported only for Paddle Billing keys' };
  try {
    const baseUrl = getBaseUrl();
    let priceId = params.priceId;
    if (!priceId && params.productId) {
      priceId = await resolvePriceId(params.productId);
    }
    if (!priceId) return { error: 'Failed to resolve price id' };
    const body: any = { items: [{ price_id: priceId, quantity: params.quantity || 1 }], enable_checkout: true };
    if (params.userEmail) body.customer = { email: params.userEmail };
    if (params.returnUrl) body.return_url = params.returnUrl;
    const allowedIncludes = ['address','business','customer','discount','seller','adjustment','adjustments','adjustments_totals','recurring','available_payment_methods','consents'];
    let endpoint = `${baseUrl}/transactions`;
    if (params.include && Array.isArray(params.include) && params.include.length > 0) {
      const invalid = params.include.filter(i => !allowedIncludes.includes(i));
      if (invalid.length > 0) return { error: `Invalid include values: ${invalid.join(', ')}` };
      endpoint = `${endpoint}?include=${params.include.join(',')}`;
    }
    const res = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${PADDLE_VENDOR_AUTH}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) return { error: json?.error?.message || json?.detail || 'Failed to create transaction', code: json?.error?.code } as any;
    const url = json?.data?.checkout?.url || json?.data?.checkout_url || '';
    if (!url) return { error: 'Transaction did not return a checkout URL' };
    return { url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function listProducts(): Promise<PaddleResult<{ products: any[] }>> {
  if (!PADDLE_VENDOR_AUTH) return { error: 'Paddle credentials not configured' };
  try {
    const baseUrl = getBaseUrl();
    if (isBillingApiKey()) {
      const endpoint = `${baseUrl}/products`;
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${PADDLE_VENDOR_AUTH}` } });
      const json = await res.json();
      if (!res.ok) return { error: json?.error?.message || json?.detail || 'Failed to list products' };
      return { products: json?.data || json?.products || [] };
    }
    // Classic vendor API
    const payload = new URLSearchParams();
    payload.set('vendor_id', PADDLE_VENDOR_ID || '');
    payload.set('vendor_auth_code', PADDLE_VENDOR_AUTH || '');
    const baseUrlVendor = getVendorBaseUrl();
    const endpoint = `${baseUrlVendor}/product/get_products`;
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: payload.toString() });
    const json = await res.json();
    if (!res.ok || json?.success === false) return { error: json?.error?.message || 'Failed to fetch products (vendor)' };
    return { products: json?.response || [] };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function listPrices(productId?: string): Promise<PaddleResult<{ prices: any[] }>> {
  if (!PADDLE_VENDOR_AUTH) return { error: 'Paddle credentials not configured' };
  if (!isBillingApiKey()) return { error: 'Prices endpoint only for Paddle Billing' };
  try {
    const baseUrl = getBaseUrl();
    const url = productId ? `${baseUrl}/prices?product_id=${encodeURIComponent(productId)}` : `${baseUrl}/prices`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${PADDLE_VENDOR_AUTH}` } });
    const json = await res.json();
    if (!res.ok) return { error: json?.error?.message || json?.detail || 'Failed to list prices' };
    return { prices: json?.data || json?.prices || [] };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function resolveProductId(productIdOrCode: string): Promise<string> {
  if (!productIdOrCode) return productIdOrCode;
  if (String(productIdOrCode).startsWith('pro_')) return productIdOrCode;
  try {
    const result = await listProducts();
    if ('error' in result) return productIdOrCode;
    const products = result.products || [];
    const matched = products.find((p: any) => (p.id === productIdOrCode) || (p.name && p.name.toLowerCase().includes(String(productIdOrCode).toLowerCase())));
    return matched?.id || productIdOrCode;
  } catch (err) {
    return productIdOrCode;
  }
}

export async function resolvePriceId(productOrPriceId: string): Promise<string> {
  if (!productOrPriceId) return productOrPriceId;
  if (String(productOrPriceId).startsWith('pri_')) return productOrPriceId;
  if (String(productOrPriceId).startsWith('pro_')) {
    const res = await listPrices(productOrPriceId);
    if ('error' in res) return productOrPriceId;
    const prices = res.prices || [];
    if (prices.length > 0) return prices[0].id;
  }
  return productOrPriceId;
}

export async function getCustomerSubscriptions(emailOrCustomerId: string): Promise<PaddleResult<{ subscriptions: any[] }>> {
  if (!PADDLE_VENDOR_AUTH) return { error: 'Paddle credentials not configured' };
  try {
    const baseUrl = getBaseUrl();
    if (isBillingApiKey()) {
      const url = `${baseUrl}/subscriptions?customer_email=${encodeURIComponent(emailOrCustomerId)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${PADDLE_VENDOR_AUTH}`, 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (!res.ok) return { error: json?.error?.message || json?.detail || 'Failed to fetch subscriptions' } as any;
      const subs = (json?.data || json?.subscriptions || []).map((s: any) => ({ id: String(s.id ?? s.subscription_id), status: s.status || s.state || 'unknown', variantId: String(s.variant_id ?? s.plan_id ?? ''), productId: String(s.product_id ?? s.product ?? ''), renewsAt: s.next_payment_at ?? s.next_bill_date ?? null, endsAt: s.canceled_at ?? s.ended_at ?? null }));
      return { subscriptions: subs };
    }
    const payload = new URLSearchParams();
    payload.set('vendor_id', PADDLE_VENDOR_ID || '');
    payload.set('vendor_auth_code', PADDLE_VENDOR_AUTH || '');
    payload.set('email', emailOrCustomerId);
    const endpoint = `${getVendorBaseUrl()}/subscription/users`;
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: payload.toString() });
    const json = await res.json();
    if (!res.ok || json?.success === false) return { error: json?.error?.message || 'Failed to fetch subscriptions' } as any;
    const subs = (json?.response || []).map((s: any) => ({ id: String(s.subscription_id ?? s.id), status: s.state || s.status || 'unknown', variantId: String(s.variant_id ?? s.plan_id ?? ''), productId: String(s.plan_id ?? s.product_id ?? ''), renewsAt: s.next_payment ?? s.next_bill_date ?? null, endsAt: s.ended_at ?? s.canceled_at ?? null }));
    return { subscriptions: subs };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<PaddleResult<{ success: boolean }>> {
  if (!PADDLE_VENDOR_AUTH) return { error: 'Paddle credentials not configured' };
  try {
    const baseUrl = getBaseUrl();
    if (isBillingApiKey()) {
      const endpoint = `${baseUrl}/subscriptions/${subscriptionId}/cancel`;
      const res = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${PADDLE_VENDOR_AUTH}`, 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (!res.ok) return { error: json?.error?.message || 'Failed to cancel subscription' } as any;
      return { success: true };
    }
    const payload = new URLSearchParams();
    payload.set('vendor_id', PADDLE_VENDOR_ID || '');
    payload.set('vendor_auth_code', PADDLE_VENDOR_AUTH || '');
    payload.set('subscription_id', subscriptionId);
    const endpoint = `${getVendorBaseUrl()}/subscription/users_cancel`;
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: payload.toString() });
    const json = await res.json();
    if (!res.ok || json?.success === false) return { error: json?.error?.message || 'Failed to cancel subscription' } as any;
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export function isActiveSubscription(status: string): boolean {
  return ['active', 'trialing', 'paused'].includes(String(status || '').toLowerCase());
}

export function verifyWebhookSignature(payload: string | URLSearchParams | Record<string, any>, signature: string, publicKey?: string): boolean {
  try {
    const key = publicKey || PADDLE_PUBLIC_KEY;
    if (!key) { console.warn('PADDLE_PUBLIC_KEY not set; skipping webhook verification (insecure)'); return true; }
    let bodyObj: Record<string, any> = {};
    if (typeof payload === 'string') { const p = new URLSearchParams(payload); for (const [k, v] of p.entries()) bodyObj[k] = v; }
    else if (payload instanceof URLSearchParams) { for (const [k, v] of payload.entries()) bodyObj[k] = v; }
    else bodyObj = payload;
    delete bodyObj['p_signature'];
    function stableStringify(obj: any): string { if (obj === null || obj === undefined) return ''; if (typeof obj !== 'object') return String(obj); if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']'; const keys = Object.keys(obj).sort(); return '{' + keys.map(k => `${k}:${stableStringify(obj[k])}`).join(',') + '}'; }
    const message = stableStringify(bodyObj);
    const verify = crypto.createVerify('RSA-SHA1'); verify.update(message); verify.end();
    const sigBuffer = Buffer.from(signature, 'base64');
    const pem = String(key).includes('-----BEGIN PUBLIC KEY-----') ? String(key) : `-----BEGIN PUBLIC KEY-----\n${String(key)}\n-----END PUBLIC KEY-----`;
    return verify.verify(pem, sigBuffer);
  } catch (err) {
    console.error('verifyWebhookSignature err', err);
    return false;
  }
}

export default { createCheckout, createTransaction, listProducts, listPrices, resolvePriceId, resolveProductId, getCustomerSubscriptions, cancelSubscription, isActiveSubscription, verifyWebhookSignature, PRODUCTS };
