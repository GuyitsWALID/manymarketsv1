#ManyMarkets
# Market Reaserch Tool and Digital Product Builder Tool
![screenshot-01_15, 01_45_05 PM](https://github.com/user-attachments/assets/316943f6-63fe-4807-93d6-12338fd6bf32)

The **UVZ (Unique Value Zone) Platform** is a SaaS solution designed to democratize digital product creation.

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: Supabase
- **AI**: Gemini API
- **Payments**: using whop checkout

Pricing/Billing Configuration:
- The app supports paid plans and i am using whop checkout.
- To temporarily disable billing (ManyMarkets free to use), set `NEXT_PUBLIC_ENABLE_PRICING=false` or omit it (default is disabled).
- To re-enable billing later, set `NEXT_PUBLIC_ENABLE_PRICING=true` and configure Paddle/Stripe environment variables as documented.

Database migration:
- A migration file `db/migrations/2025-12-15-disable-pricing.sql` is included which sets all `profiles.subscription_tier = 'free'` and clears payment identifiers.
- Run it with your preferred DB tooling, e.g. psql:

```bash
psql $DATABASE_URL -f db/migrations/2025-12-15-disable-pricing.sql
```

- Or call the admin API (safer when SUPABASE_SERVICE_ROLE_KEY is configured):

```bash
curl -X POST -H "x-admin-token: $ADMIN_API_KEY" https://your-app.com/api/admin/disable-pricing
```

- Always back up your database before running migrations that modify billing data.


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

## Project Structure

- `app/`: Next.js App Router pages and layouts.
- `components/`: Reusable UI components.
- `lib/`: API clients (Supabase, Gemini, Whop checkout).
- `public/`: Static assets.

