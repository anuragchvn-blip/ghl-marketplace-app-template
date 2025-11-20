# 🚀 Quick Start Guide

## Testing Locally

### 1. Start Development Server
```bash
npm run dev
```
Server starts at: `http://localhost:3000`

### 2. Access Pages

#### User Dashboard
```
http://localhost:3000/dashboard?locationId=test-location-123
```
- Test user is already created
- Day pass is inactive (ready to purchase)
- Can scrape leads with mock scraper

#### Admin Dashboard
```
http://localhost:3000/admin
```
- Password: `admin123`
- View all users, stats, purchases

### 3. Test Day Pass Flow

**Step 1: Try to scrape without pass**
- Go to dashboard
- Fill in business type and location
- Click "Start Scraping"
- Should see: ⚠️ "Please purchase a Day Pass to scrape leads."

**Step 2: Purchase day pass**
- Click "Buy Day Pass - $7"
- PayPal checkout opens (live mode)
- Complete payment (or cancel to test)
- Redirected back with success/cancelled message

**Step 3: Scrape with active pass**
- Status badge shows: "0/15 leads" and timer
- Fill scraping form
- Click "Start Scraping"
- Leads stream in real-time
- Counter increments: "1/15", "2/15", etc.
- Stops at 15 leads

**Step 4: Test expiration**
- Wait 24 hours (or manually update DB)
- Day pass expires automatically
- Scraping blocked again

### 4. Test Admin Dashboard

**View Stats:**
- Total users count
- Active passes count
- Revenue from purchases
- Leads scraped across all users

**Manage Users:**
- See all registered users
- Check day pass status
- View leads used counter
- See purchase history per user

**Monitor Purchases:**
- Recent purchase list
- Payment status
- Activation dates

### 5. Test Features

**Notes:**
- Click "Add note..." on any lead
- Type and click "Save"
- Note persists after reload

**GHL Push:**
- Click "Push to GHL" on any lead
- Shows success message
- Lead marked as pushed (mock mode)

**Calendar:**
- Click "Schedule" on any lead
- Enter meeting details
- Google OAuth required (will redirect)

---

## Production Deployment

### Deploy to Vercel
```bash
vercel --prod
```

### Update Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

**Required Updates:**
```env
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/google/callback
```

**Keep these as-is:**
- All other variables from `.env`
- `PAYPAL_MODE=live` (already configured)

### Submit to GHL Marketplace
1. Create app listing
2. Add OAuth redirect: `https://your-domain.vercel.app/api/auth/ghl`
3. Configure scopes from `GHL_SCOPES.md`
4. Submit for review

---

## Useful Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server

# Database
npx prisma studio              # Open database GUI
npx prisma generate            # Regenerate Prisma client
npx prisma db push             # Push schema changes
npx tsx scripts/create-test-user.ts  # Create test user

# Admin
# Access admin dashboard at /admin with password: admin123
```

---

## Testing Checklist

- [ ] Dashboard loads at `/dashboard?locationId=test-location-123`
- [ ] Admin dashboard loads at `/admin` (password: admin123)
- [ ] Day pass button shows when inactive
- [ ] Scraping blocked without day pass
- [ ] PayPal checkout opens (can cancel)
- [ ] After purchase, status badge shows green
- [ ] Leads counter shows 0/15
- [ ] Scraping works and streams leads
- [ ] Counter increments after each lead
- [ ] Stops at 15 leads
- [ ] Notes can be added and saved
- [ ] GHL push marks lead as pushed
- [ ] Admin dashboard shows correct stats

---

## Troubleshooting

### 401 Unauthorized Errors
- Make sure to use `?locationId=test-location-123` in URL
- Or the test user isn't created: `npx tsx scripts/create-test-user.ts`

### Day Pass Not Working
- Check database: `npx prisma studio`
- Verify `dayPassActive = true` and `dayPassExpiresAt > now`
- Check `dayPassLeadsUsed < dayPassLeadsLimit`

### Scraping Not Working
- Check SerpAPI key is valid
- Fallback to mock scraper automatically
- Check console for error messages

### Admin Dashboard Empty
- Create test user first
- Make a test purchase
- Check API endpoints return 200

---

## Next Steps

1. ✅ Test everything locally
2. ✅ Deploy to Vercel
3. ✅ Update production URLs
4. ✅ Submit to GHL marketplace
5. ✅ Test OAuth flow in GHL
6. ✅ Enable real GHL API push
7. ✅ Monitor admin dashboard
8. ✅ Process real payments

**Ready for production!** 🚀
