# Supabase Setup for UVZ Platform

## Prerequisites
- Create a Supabase account at https://supabase.com
- Create a new project in your Supabase dashboard

## Setup Steps

### 1. Get Your Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the following:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - Anon/Public Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

### 3. Enable OAuth Providers in Supabase

#### Google OAuth
1. Go to Authentication > Providers in Supabase
2. Enable Google provider
3. Create OAuth credentials in Google Cloud Console:
   - Go to https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase

#### GitHub OAuth
1. Go to Authentication > Providers in Supabase
2. Enable GitHub provider
3. Create OAuth App in GitHub:
   - Go to Settings > Developer settings > OAuth Apps
   - Create new OAuth App
   - Set Authorization callback URL: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase

### 4. Configure Site URL and Redirect URLs
In Supabase > Authentication > URL Configuration:
- Site URL: `http://localhost:3000` (for development) or your production URL
- Redirect URLs: Add both:
 - Redirect URLs: Add these (exact paths, avoid wildcards):
  - `http://localhost:3000/auth/callback` (local dev)
  - `http://localhost:3000` (local dev fallback)
  - `https://your-production-domain.com/auth/callback` (production)
  - `https://your-production-domain.com` (production fallback)

### 5. Database Schema (Optional)
The authentication tables are automatically created by Supabase. If you need additional user profile data:

```sql
-- Create a profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Create trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Authentication Flow

### Login/Signup
- Email/Password authentication
- Google OAuth
- GitHub OAuth

### Protected Routes
The middleware automatically protects these routes:
- `/chat` - Chat interface
- `/marketplace` - Product marketplace
- `/builder` - Product builder
- `/dashboard` - User dashboard

### Session Management
- Sessions are automatically managed by Supabase
- Refresh tokens are handled automatically
- Users stay logged in across browser sessions

## Usage in Components

### Client Components
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

### Server Components
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
```

## Testing Authentication

1. Start the development server:
```bash
npm run dev
```

2. Navigate to http://localhost:3000/login
3. Try signing up with email or OAuth providers
4. Verify you're redirected to the chat page (`/chat`) after authentication
5. Test accessing protected routes

## Notes for Developers

- When calling `supabase.auth.signInWithOAuth`, include a `redirectTo` that points to your app callback and a `next` query string with the final path:

```ts
supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${window.location.origin}/auth/callback?next=/chat` }
});
```

- For email sign ups, include `emailRedirectTo` similarly:

```ts
supabase.auth.signUp({
  email,
  password,
  options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/chat` }
});
```

- Ensure your app has a route at `/auth/callback` that exchanges the `code` for a session and then redirects to the `next` query param (defaulting to `/chat`).

## Troubleshooting

### OAuth Not Working
- Check that redirect URLs are correctly configured in both Supabase and OAuth provider
- Verify OAuth credentials are correct in Supabase dashboard
- Make sure your local development URL matches the configured site URL

### Session Issues
- Clear browser cookies and try again
- Check that environment variables are loaded correctly
- Verify Supabase project is not paused (free tier limitation)

### CORS Errors
- Add your domain to the allowed URLs in Supabase dashboard
- Check that API keys are correct and not expired
