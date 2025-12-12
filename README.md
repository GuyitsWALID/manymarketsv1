# UVZ Platform

The **UVZ (Unique Value Zone) Platform** is a SaaS solution designed to democratize digital product creation.

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: Supabase
- **AI**: Gemini API
- **Payments**: Stripe
 - **Payments**: Paddle (primary), Stripe (legacy)

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Copy `.env.local.example` to `.env.local` and fill in your API keys.
    ```bash
    cp .env.local.example .env.local
    ```
    Add the following Paddle environment variables to `.env.local` as needed:
    ```bash
    PADDLE_VENDOR_ID=your_paddle_vendor_id
    PADDLE_VENDOR_AUTH=your_paddle_vendor_auth
    PADDLE_PUBLIC_KEY='-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----'
    PADDLE_PRO_PRODUCT_ID=your_pro_product_id (optional)
    NEXT_PUBLIC_PADDLE_VENDOR_ID=your_paddle_vendor_id
    NEXT_PUBLIC_PADDLE_PRO_PRODUCT_ID=your_pro_product_id (optional)
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your_paddle_client_token
    NEXT_PUBLIC_PADDLE_ENV=sandbox # or 'production'
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser.

Cleaning build artifacts:
If you switched billing providers (e.g., from Lemon Squeezy or Stripe to Paddle) you should clear the build cache and rebuild to remove compiled references:
```powershell
# PowerShell (Windows)
Remove-Item -Recurse -Force .next
npm run build
```
To validate the Paddle vendor API key locally, create `.env.local` with the PADDLE env variables and run the test script:

```bash
npm install node-fetch@3 querystring dotenv # if needed
node scripts/test-paddle.js
```

This script will attempt to generate a test pay-link using your vendor credentials and print the pay link (if successful) or any API error from Paddle.

## Project Structure

- `app/`: Next.js App Router pages and layouts.
- `components/`: Reusable UI components.
- `lib/`: API clients (Supabase, Gemini, Stripe).
- `public/`: Static assets.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
## Payment Provider Integration & Test Checklist
If you're adding or migrating to a new payment provider, use this checklist to verify the integration using your provider’s dashboard or management console:

1. Create a test product and get its `product_id` in the payment provider dashboard.
2. Add environment variables required by the provider to `.env.local` (see SUPABASE_SETUP.md).
3. Wire any client-side env keys (e.g., `NEXT_PUBLIC_PARKING_CLIENT_TOKEN` or similar) required for overlay or link generation.
4. Use the provider dashboard’s webhooks tester to send sample events to your webhook endpoint and verify they reach your app.
5. Confirm the `profiles` table updates with customer/subscription identifiers and that `subscription_tier` values update properly.
6. If you opt to use a checkout overlay, make sure the client-side token and vendor id (if required) are set and the provider's overlay JS loads on the page.

### Payment Provider Domain Verification
Some payment providers may request domain verification using an HTML meta tag, a verification file, or a DNS record. To add a meta tag, insert it in the `head` of your site (e.g. in `app/layout.tsx`) while in development or on your production domain. Example:
```html
<meta name="payment-provider-verify" content="YOUR_VERIFICATION_TOKEN" />
```
After adding the meta tag or verification file, follow your provider's instructions to complete the domain verification process (consult your payment provider’s documentation).

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
