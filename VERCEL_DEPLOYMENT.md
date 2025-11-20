# OutreachOS - Vercel Deployment Guide

## Custom Domain Setup

### 1. Deploy to Vercel

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy to production
vercel --prod
```

### 2. Add Custom Domain

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Domains**
3. Add your custom domain: `outreachos.com` (or your preferred domain)
4. Follow Vercel's DNS configuration instructions

### 3. DNS Configuration

Add these records to your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare):

**For apex domain (outreachos.com):**
```
Type: A
Name: @
Value: 76.76.19.19
TTL: 3600
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### 4. Update Environment Variables in Vercel

Go to **Settings** → **Environment Variables** and add:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://outreachos.com
NEXT_PUBLIC_APP_NAME=OutreachOS

# Database
DATABASE_URL=your_supabase_postgres_url

# GHL OAuth
GHL_APP_CLIENT_ID=your_ghl_client_id
GHL_APP_CLIENT_SECRET=your_ghl_client_secret
GHL_API_DOMAIN=https://services.leadconnectorhq.com
GOOGLE_REDIRECT_URI=https://outreachos.com/api/google/callback

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=live

# Day Pass Configuration
DAY_PASS_PRICE=7
DAY_PASS_DURATION_HOURS=24
DAY_PASS_LEADS_LIMIT=15

# API Keys
GROQ_API_KEY=your_groq_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Admin
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_admin_password
ADMIN_SECRET_KEY=your_secret_admin_key
```

### 5. Update GHL Marketplace Settings

1. Go to GHL Marketplace Developer Portal
2. Update OAuth Redirect URL: `https://outreachos.com/api/auth/ghl`
3. Update Webhook URL: `https://outreachos.com/api/webhooks/ghl/uninstall`
4. Update App URL: `https://outreachos.com`

### 6. SSL Certificate

Vercel automatically provisions SSL certificates for all domains. No action needed.

### 7. Database Migration

If you haven't run migrations on production database:

```bash
# Push schema to production database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 8. Test the Deployment

1. Visit `https://outreachos.com`
2. Test OAuth flow: Click "Connect with GHL"
3. Test day pass purchase
4. Test admin dashboard: `https://outreachos.com/admin`
5. Test lead scraping and GHL push

## Monitoring

- **Logs**: View in Vercel Dashboard → Deployments → Functions
- **Analytics**: Enable Vercel Analytics in Settings
- **Errors**: Set up error tracking (e.g., Sentry)

## Custom Subdomain Options

You can also set up subdomains:
- `app.outreachos.com` - Main application
- `admin.outreachos.com` - Admin dashboard
- `api.outreachos.com` - API endpoints

## Performance Optimization

- Enable **Edge Caching** in Vercel settings
- Use **Image Optimization** for any images
- Enable **Compression** (Vercel does this automatically)

## Troubleshooting

**Domain not working:**
- Wait 24-48 hours for DNS propagation
- Check DNS records with `nslookup outreachos.com`
- Verify Vercel domain configuration

**OAuth not working:**
- Ensure GHL redirect URL matches exactly
- Check environment variables are set in Vercel
- Verify NEXT_PUBLIC_APP_URL is correct

**Database connection errors:**
- Verify DATABASE_URL is correct in Vercel env vars
- Check Supabase connection pooling settings
- Ensure database is accessible from Vercel's IP ranges
