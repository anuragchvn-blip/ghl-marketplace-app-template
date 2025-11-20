# Vercel Environment Variables Setup

## Required Environment Variables

After deploying to Vercel, you MUST add these environment variables in your Vercel project settings:

### Navigation:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable below for **Production**, **Preview**, and **Development** environments

---

## Database Configuration

```bash
DATABASE_URL="postgresql://postgres.xxx:password@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

**How to get this:**
1. Go to your Supabase project dashboard
2. Click on **Settings** → **Database**
3. Scroll to **Connection string** → **URI** (with connection pooling)
4. Copy the URL and replace `[YOUR-PASSWORD]` with your database password

---

## GHL OAuth Configuration

```bash
GHL_APP_CLIENT_ID="your_client_id_from_ghl_marketplace"
GHL_APP_CLIENT_SECRET="your_client_secret_from_ghl_marketplace"
GHL_API_DOMAIN="https://services.leadconnectorhq.com"
```

---

## PayPal Configuration

```bash
PAYPAL_CLIENT_ID="your_paypal_client_id"
PAYPAL_CLIENT_SECRET="your_paypal_client_secret"
PAYPAL_MODE="live"
```

**Get PayPal credentials:**
1. Go to https://developer.paypal.com/dashboard/
2. Create a REST API app
3. Copy Client ID and Secret

---

## Google OAuth (Calendar Integration)

```bash
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="https://your-domain.vercel.app/api/google/callback"
```

**Get Google credentials:**
1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-domain.vercel.app/api/google/callback`

---

## API Keys

```bash
GROQ_API_KEY="your_groq_api_key"
GOOGLE_MAPS_API_KEY="your_google_maps_api_key"
```

**Get Groq API Key:**
- Go to https://console.groq.com/keys

**Get Google Maps API Key:**
- Go to https://console.cloud.google.com/
- Enable Google Maps API
- Create API key

---

## App Configuration

```bash
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
NEXT_PUBLIC_APP_NAME="OutreachOS"
```

---

## Day Pass Configuration

```bash
DAY_PASS_PRICE="7"
DAY_PASS_DURATION_HOURS="24"
DAY_PASS_LEADS_LIMIT="15"
```

---

## Admin Configuration

```bash
NEXT_PUBLIC_ADMIN_PASSWORD="your_secure_admin_password"
ADMIN_SECRET_KEY="your_secret_admin_key_for_api_auth"
```

---

## After Adding Variables

1. **Redeploy** your project for changes to take effect
2. Or use CLI: `vercel --prod` to deploy with new variables
3. Test all features:
   - GHL OAuth login
   - PayPal day pass purchase
   - Google Calendar sync
   - Lead scraping
   - Admin dashboard

---

## Common Issues

### Database Connection Error
- Verify DATABASE_URL is correct
- Check Supabase project is running
- Use connection pooling URL (includes `?pgbouncer=true`)
- Verify IP allowlist in Supabase (should allow all IPs or Vercel IPs)

### OAuth Redirect Errors
- Verify GOOGLE_REDIRECT_URI matches exactly in Google Console
- Update GHL marketplace with correct redirect URL: `https://your-domain.vercel.app/api/auth/ghl`

### PayPal Payment Issues
- Switch to PAYPAL_MODE="sandbox" for testing
- Verify webhook URL in PayPal dashboard (if using webhooks)

---

## Database Setup (First Time Only)

After setting DATABASE_URL, push your Prisma schema:

```bash
npx prisma db push
```

This creates all necessary tables in your Supabase database.
