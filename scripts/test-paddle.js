#!/usr/bin/env node
// Test script to verify Paddle Vendor API access
// Usage: node scripts/test-paddle.js

const dotenv = require('dotenv');
const qs = require('node:querystring');

// Load .env.local specifically (our repo uses .env.local)
dotenv.config({ path: '.env.local' });

const VENDOR_ID = process.env.PADDLE_VENDOR_ID || process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID;
const VENDOR_AUTH = process.env.PADDLE_VENDOR_AUTH;
const PRODUCT_ID = process.env.PADDLE_PRO_PRODUCT_ID || process.env.NEXT_PUBLIC_PADDLE_PRO_PRODUCT_ID;

if (!VENDOR_ID || !VENDOR_AUTH || !PRODUCT_ID) {
  console.error('Missing required Paddle environment variables. Please set PADDLE_VENDOR_ID, PADDLE_VENDOR_AUTH and PADDLE_PRO_PRODUCT_ID in .env.local');
  process.exit(1);
}

async function tryEndpoint(name, url, body) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const json = await res.json();
    console.log(`${name} -> HTTP ${res.status}`);
    console.log(JSON.stringify(json, null, 2));
    return { res, json };
  } catch (err) {
    console.error(`${name} -> Request failed`, err);
    return { res: null, json: null };
  }
}

(async function run() {
  try {
    const payload = new URLSearchParams();
    payload.set('vendor_id', String(VENDOR_ID));
    payload.set('vendor_auth_code', String(VENDOR_AUTH));
    payload.set('product_id', String(PRODUCT_ID));
    // Optional: passthrough
    payload.set('passthrough', 'test_local_user');

    // First, try to list subscription users (simple endpoint for diagnostics)
    const subsPayload = new URLSearchParams();
    subsPayload.set('vendor_id', VENDOR_ID);
    subsPayload.set('vendor_auth_code', VENDOR_AUTH);
    subsPayload.set('email', 'test@example.com');
    await tryEndpoint('subscription/users', 'https://vendors.paddle.com/api/2.0/subscription/users', subsPayload);

    // Try to generate a pay link (the primary test)
    payload.set('vendor_id', VENDOR_ID);
    payload.set('vendor_auth_code', VENDOR_AUTH);
    payload.set('product_id', PRODUCT_ID);

    const { res, json } = await tryEndpoint('product/generate_pay_link', 'https://vendors.paddle.com/api/2.0/product/generate_pay_link', payload);
    if (!res || (!res.ok && json?.success === false)) {
      console.error('generate_pay_link endpoint returned an error.');
      if (json) {
        process.exit(1);
      } else {
        process.exit(1);
      }
    }

    const url = json?.response?.url;
    if (url) console.log('Paddle pay link:', url);
  } catch (err) {
    console.error('Unexpected error while calling Paddle API:', err);
    process.exit(1);
  }
})();
