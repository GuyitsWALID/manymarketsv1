import crypto from 'crypto';

const LEMON_SQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1';

// Get API key - throws if not set
function getApiKey(): string {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  if (!apiKey) {
    throw new Error('LEMON_SQUEEZY_API_KEY environment variable is not set');
  }
  return apiKey;
}

// Get store ID - throws if not set
function getStoreId(): string {
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
  if (!storeId) {
    throw new Error('LEMON_SQUEEZY_STORE_ID environment variable is not set');
  }
  return storeId;
}

// API request helper
async function lemonSqueezyFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiKey = getApiKey();
  
  const response = await fetch(`${LEMON_SQUEEZY_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${apiKey}`,
      ...options.headers,
    },
  });
  
  return response;
}

// Product/Variant IDs from your Lemon Squeezy dashboard
export const PRODUCTS = {
  FREE: 'free',  // Not a real product - just for tracking free users
  PRO: process.env.LEMON_SQUEEZY_PRO_VARIANT_ID || 'pro',
} as const;

// Create a checkout session
export async function createCheckout(params: {
  variantId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  redirectUrl?: string;
}): Promise<{ url: string } | { error: string }> {
  try {
    const storeId = getStoreId();
    
    const response = await lemonSqueezyFetch('/checkouts', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: params.userEmail,
              name: params.userName || params.userEmail.split('@')[0],
              custom: {
                user_id: params.userId,
              },
            },
            product_options: {
              redirect_url: params.redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/builder?upgraded=true`,
            },
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: storeId,
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: params.variantId,
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Lemon Squeezy checkout error:', errorData);
      return { error: errorData.errors?.[0]?.detail || 'Failed to create checkout' };
    }

    const data = await response.json();
    return { url: data.data.attributes.url };
  } catch (error) {
    console.error('Checkout creation error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create checkout' };
  }
}

// Get customer subscriptions
export async function getCustomerSubscriptions(customerId: string): Promise<{
  subscriptions: Array<{
    id: string;
    status: string;
    variantId: string;
    productId: string;
    renewsAt: string | null;
    endsAt: string | null;
  }>;
} | { error: string }> {
  try {
    const response = await lemonSqueezyFetch(
      `/subscriptions?filter[user_email]=${encodeURIComponent(customerId)}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.errors?.[0]?.detail || 'Failed to fetch subscriptions' };
    }

    const data = await response.json();
    
    const subscriptions = data.data.map((sub: {
      id: string;
      attributes: {
        status: string;
        variant_id: number;
        product_id: number;
        renews_at: string | null;
        ends_at: string | null;
      };
    }) => ({
      id: sub.id,
      status: sub.attributes.status,
      variantId: String(sub.attributes.variant_id),
      productId: String(sub.attributes.product_id),
      renewsAt: sub.attributes.renews_at,
      endsAt: sub.attributes.ends_at,
    }));

    return { subscriptions };
  } catch (error) {
    console.error('Fetch subscriptions error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch subscriptions' };
  }
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    const response = await lemonSqueezyFetch(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.errors?.[0]?.detail || 'Failed to cancel subscription' };
    }

    return { success: true };
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to cancel subscription' };
  }
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Type for webhook events
export interface LemonSqueezyWebhookEvent {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      user_email: string;
      user_name: string;
      status: string;
      variant_id: number;
      product_id: number;
      order_id: number;
      customer_id: number;
      renews_at: string | null;
      ends_at: string | null;
      created_at: string;
      updated_at: string;
    };
  };
}

// Subscription status types
export type SubscriptionStatus = 
  | 'on_trial'
  | 'active'
  | 'paused'
  | 'past_due'
  | 'unpaid'
  | 'cancelled'
  | 'expired';

// Check if status means user has active subscription
export function isActiveSubscription(status: SubscriptionStatus | string): boolean {
  return ['on_trial', 'active', 'paused', 'past_due'].includes(status);
}
