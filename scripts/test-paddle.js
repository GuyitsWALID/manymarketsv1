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

async function tryEndpoint(name, url, body, opts = {}) {
  try {
    const method = opts.method || 'POST';
    const headers = opts.headers || { 'Content-Type': 'application/x-www-form-urlencoded' };
    const payload = opts.rawBody ?? (body ? body.toString() : undefined);
    const fetchArgs = { method, headers };
    if (payload !== undefined) fetchArgs.body = payload;
    const res = await fetch(url, fetchArgs);
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

    // Detect API type and base URL
    const isBilling = /pdl_(sdbx|live)_apikey_/.test(String(VENDOR_AUTH));
    const isSandbox = String(VENDOR_AUTH).includes('sdbx');
    const billingBase = isSandbox ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com';
    const vendorBase = isSandbox ? 'https://sandbox-vendors.paddle.com/api/2.0' : 'https://vendors.paddle.com/api/2.0';

    console.log('Detected key type:', isBilling ? 'Billing' : 'Vendor (Classic)');
    console.log('Detected environment:', isSandbox ? 'Sandbox' : 'Live');

    if (isBilling) {
      // List products from billing API
      await tryEndpoint('Billing - GET /products', `${billingBase}/products`, null, { method: 'GET', headers: { Authorization: `Bearer ${VENDOR_AUTH}` } });
      // Attempt to resolve price id for the provided PRODUCT_ID. If PRODUCT_ID is a price id (pri_), use it.
      let priceId = null;
      if (String(PRODUCT_ID).startsWith('pri_')) {
        priceId = PRODUCT_ID;
      } else if (String(PRODUCT_ID).startsWith('pro_')) {
        const { res: priceRes, json: priceJson } = await tryEndpoint('Billing - GET /prices?product_id', `${billingBase}/prices?product_id=${encodeURIComponent(PRODUCT_ID)}`, null, { method: 'GET', headers: { Authorization: `Bearer ${VENDOR_AUTH}` } });
        if (priceRes && priceRes.ok && Array.isArray(priceJson?.data) && priceJson.data.length > 0) {
          priceId = priceJson.data[0].id;
        }
      }
      // Fallback: if we still don't have a priceId, try listing products and use the first product's first price
      if (!priceId) {
        const { res: listRes, json: listJson } = await tryEndpoint('Billing - GET /products (fallback)', `${billingBase}/products`, null, { method: 'GET', headers: { Authorization: `Bearer ${VENDOR_AUTH}` } });
        if (listRes && listRes.ok && Array.isArray(listJson?.data) && listJson.data.length > 0) {
          const candidate = listJson.data[0];
          const { res: pricesRes, json: pricesJson } = await tryEndpoint('Billing - GET /prices?product_id (fallback)', `${billingBase}/prices?product_id=${encodeURIComponent(candidate.id)}`, null, { method: 'GET', headers: { Authorization: `Bearer ${VENDOR_AUTH}` } });
          if (pricesRes && pricesRes.ok && Array.isArray(pricesJson?.data) && pricesJson.data.length > 0) {
            priceId = pricesJson.data[0].id;
          }
        }
      }
      if (!priceId) {
        console.error('Failed to resolve a price id for transaction creation');
      } else {
        // Try to create a transaction (checkout url) using resolved price id
        const txBody = JSON.stringify({ items: [{ price_id: priceId, quantity: 1 }], enable_checkout: true });
        await tryEndpoint('Billing - POST /transactions', `${billingBase}/transactions`, null, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${VENDOR_AUTH}` }, rawBody: txBody });
        // Example: fetch transaction with customer data included
        await tryEndpoint('Billing - POST /transactions?include=customer,address', `${billingBase}/transactions?include=customer,address`, null, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${VENDOR_AUTH}` }, rawBody: txBody });
      }
    } else {
      // Classic vendor API - check subscriptions and generate pay link
      const subsPayload = new URLSearchParams();
      subsPayload.set('vendor_id', VENDOR_ID);
      subsPayload.set('vendor_auth_code', VENDOR_AUTH);
      subsPayload.set('email', 'test@example.com');
      await tryEndpoint('subscription/users', `${vendorBase}/subscription/users`, subsPayload);

      // Try to generate a pay link (classic)
      payload.set('vendor_id', VENDOR_ID);
      payload.set('vendor_auth_code', VENDOR_AUTH);
      payload.set('product_id', PRODUCT_ID);
      await tryEndpoint('product/generate_pay_link', `${vendorBase}/product/generate_pay_link`, payload);
    }

    // Try to generate a pay link (the primary test)
    payload.set('vendor_id', VENDOR_ID);
    payload.set('vendor_auth_code', VENDOR_AUTH);
    payload.set('product_id', PRODUCT_ID);

    process.exit(0);
  } catch (err) {
    console.error('Unexpected error while calling Paddle API:', err);
    process.exit(1);
  }
})();
