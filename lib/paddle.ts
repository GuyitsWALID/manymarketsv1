import crypto from 'crypto';

// Paddle API endpoints and keys
const PADDLE_VENDOR_ID = process.env.PADDLE_VENDOR_ID;
const PADDLE_VENDOR_AUTH = process.env.PADDLE_VENDOR_AUTH;
const PADDLE_PUBLIC_KEY = process.env.PADDLE_PUBLIC_KEY; // used to verify webhooks
const PADDLE_PRO_PRODUCT_ID = process.env.PADDLE_PRO_PRODUCT_ID || 'pro';

// Basic stubbed functions for Paddle integration. Replace with fuller implementations per https://developer.paddle.com

export const PRODUCTS = {
  FREE: 'free',
  PRO: PADDLE_PRO_PRODUCT_ID,
} as const;

export async function createCheckout(params: {
  productId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  redirectUrl?: string;
}): Promise<{ url: string } | { error: string }> {
  // Paddle may require using their Hosted Checkout or a server-side API to create a checkout link.
  // This function should call Paddle's API (e.g., /2.0/product/generate_pay_link) with a vendor auth token.
  // For now, return a placeholder URL that will be replaced with real implementation.
  try {
    if (!PADDLE_VENDOR_ID || !PADDLE_VENDOR_AUTH) {
      throw new Error('Paddle vendor credentials not configured');
    }

    // Use Paddle Vendor API to create a pay link for the product
    const payload = new URLSearchParams();
    payload.set('vendor_id', PADDLE_VENDOR_ID!);
    payload.set('vendor_auth_code', PADDLE_VENDOR_AUTH!);
    payload.set('product_id', params.productId);
    payload.set('passthrough', params.userId);
    if (params.userEmail) payload.set('customer_email', params.userEmail);
    if (params.userName) payload.set('title', params.userName);
    if (params.redirectUrl) payload.set('return_url', params.redirectUrl);

    const res = await fetch('https://vendors.paddle.com/api/2.0/product/generate_pay_link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
    });

    const json = await res.json();
    if (!res.ok || json?.success === false) {
      const errMsg = json?.error?.message || 'Failed to generate Paddle pay link';
      console.error('Paddle checkout creation error:', errMsg, json);
      return { error: errMsg };
    }

    const checkoutUrl = json?.response?.url || json?.response?.url || '';
    return { url: checkoutUrl };
  } catch (error) {
    console.error('Paddle checkout creation error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create checkout' };
  }
}

export async function getCustomerSubscriptions(emailOrCustomerId: string): Promise<{
  subscriptions: Array<{
    id: string;
    status: string;
    variantId: string;
    productId: string;
    renewsAt: string | null;
    endsAt: string | null;
  }>;
} | { error: string }> {
  // Paddle provides a Vendor API to list subscriptions; this would need vendor_auth and vendor_id
  try {
    if (!PADDLE_VENDOR_ID || !PADDLE_VENDOR_AUTH) {
      throw new Error('Paddle vendor credentials not configured');
    }

    // The vendor API provides endpoints to list subscription users and their subscriptions.
    // We'll try to use the subscription users list endpoint with email or paddle_user_id
    const payload = new URLSearchParams();
    payload.set('vendor_id', PADDLE_VENDOR_ID!);
    payload.set('vendor_auth_code', PADDLE_VENDOR_AUTH!);
    // Paddle supports listing by email or by paddle_user_id; we'll set customer_email
    payload.set('email', emailOrCustomerId);

    const res = await fetch('https://vendors.paddle.com/api/2.0/subscription/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
    });
    const json = await res.json();
    if (!res.ok || json?.success === false) {
      const errMsg = json?.error?.message || 'Failed to fetch Paddle subscriptions';
      console.error('Paddle fetch subscriptions error:', errMsg, json);
      return { error: errMsg };
    }

    const subscriptions = (json?.response || []).map((s: any) => ({
      id: String(s.subscription_id ?? s.id),
      status: s.state || s.status || 'unknown',
      variantId: String(s.variant_id ?? s.plan_id ?? ''),
      productId: String(s.plan_id ?? s.product_id ?? ''),
      renewsAt: s.next_payment ?? s.next_bill_date ?? null,
      endsAt: s.ended_at ?? s.canceled_at ?? null,
    }));
    return { subscriptions };
  } catch (error) {
    console.error('Paddle fetch subscriptions error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch subscriptions' };
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    if (!PADDLE_VENDOR_ID || !PADDLE_VENDOR_AUTH) {
      throw new Error('Paddle vendor credentials not configured');
    }

    const payload = new URLSearchParams();
    payload.set('vendor_id', PADDLE_VENDOR_ID!);
    payload.set('vendor_auth_code', PADDLE_VENDOR_AUTH!);
    payload.set('subscription_id', subscriptionId);

    const res = await fetch('https://vendors.paddle.com/api/2.0/subscription/users_cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
    });
    const json = await res.json();
    if (!res.ok || json?.success === false) {
      const errMsg = json?.error?.message || 'Failed to cancel Paddle subscription';
      console.error('Paddle cancel subscription error:', errMsg, json);
      return { error: errMsg };
    }
    return { success: true };
  } catch (error) {
    console.error('Paddle cancel subscription error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to cancel subscription' };
  }
}

export function isActiveSubscription(status: string): boolean {
  // Paddle subscription states include: "active", "paused", "deleted", "past_due" etc.
  return ['active', 'trialing', 'paused'].includes((status || '').toLowerCase());
}

export function verifyWebhookSignature(payload: string | URLSearchParams | Record<string, any>, signature: string, publicKey?: string): boolean {
  // Paddle webhook signature verification uses RSA with the public key. The signature is base64 encoded.
  // You need to verify by recreating the payload string and verifying against the signature with the vendor public key.
  try {
    const key = publicKey || PADDLE_PUBLIC_KEY;
    if (!key) {
      console.warn('PADDLE_PUBLIC_KEY not set; skipping webhook verification (insecure)');
      return true;
    }
    // Convert payload to an object if necessary
    let bodyObj: Record<string, any> = {};
    if (typeof payload === 'string') {
      const params = new URLSearchParams(payload);
      for (const [k, v] of params.entries()) {
        bodyObj[k] = v;
      }
    } else if (payload instanceof URLSearchParams) {
      for (const [k, v] of payload.entries()) {
        bodyObj[k] = v;
      }
    } else {
      bodyObj = payload;
    }

    // Remove the signature from the payload
    delete bodyObj['p_signature'];

    // Stable stringify the object by sorting keys recursively - this creates a deterministic representation.
    function stableStringify(obj: any): string {
      if (obj === null || obj === undefined) return '';
      if (typeof obj !== 'object') return String(obj);
      if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
      const keys = Object.keys(obj).sort();
      return '{' + keys.map(k => `${k}:${stableStringify(obj[k])}`).join(',') + '}';
    }

    const message = stableStringify(bodyObj);
    const verify = crypto.createVerify('RSA-SHA1');
    verify.update(message);
    verify.end();
    const sigBuffer = Buffer.from(signature, 'base64');
    const pem = String(key).includes('-----BEGIN PUBLIC KEY-----') ? String(key) : `-----BEGIN PUBLIC KEY-----\n${String(key)}\n-----END PUBLIC KEY-----`;
    return verify.verify(pem, sigBuffer);
  } catch (err) {
    console.error('Error verifying Paddle webhook signature', err);
    return false;
  }
}

export default {
  createCheckout,
  getCustomerSubscriptions,
  cancelSubscription,
  isActiveSubscription,
  verifyWebhookSignature,
  PRODUCTS,
};
