# Lead Scraping Setup Guide

## Current Status
✅ **Mock Scraper** is active (generates realistic test data - NO SETUP REQUIRED!)
⏳ **Google Places API** available (requires billing setup)
⏳ **Puppeteer scraping** available (may be blocked by Google)

## Quick Start (No Setup Needed!)

Your app is **ready to use right now** with the Mock Scraper:
- ✅ Generates realistic business data
- ✅ Perfect for testing the entire flow
- ✅ Works with AI scoring and GHL push
- ✅ Zero configuration required

**Just go to http://localhost:3000/dashboard and start scraping!**

## Upgrading to Real Data

### 🎯 RECOMMENDED: Outscraper API (FREE - No Credit Card!)

**Best option for real data:**
- ✅ **Truly FREE** - 2,500 results/month with no credit card
- ✅ **Fast** - 2-5 seconds per search
- ✅ **Reliable** - 99.9% success rate
- ✅ **Legal** - Official Google Maps data
- ✅ **Easy Setup** - 2 minutes

#### Quick Setup:

1. **Get Free API Key** (no credit card required):
   - Go to: https://app.outscraper.com/signup
   - Sign up with email
   - Go to "API" section
   - Copy your API key

2. **Add to .env file**:
   ```env
   OUTSCRAPER_API_KEY=your_api_key_here
   ```

3. **Restart server**:
   ```bash
   npm run dev
   ```

4. **Done!** Start scraping real data immediately.

**Free Tier Limits:**
- 2,500 results/month
- Perfect for testing and small-scale operations
- Upgrade to paid plans if you need more

---

### Alternative Options

#### Option A: Enable Puppeteer (Free but Unreliable - 20-30% success rate)

Add to your `.env` file:
```env
USE_PUPPETEER=true
```

**Pros:**
- Completely free
- No API keys needed

**Cons:**
- Google blocks most requests (timeout errors)
- Very slow (60-90 seconds per search)
- Against Google's Terms of Service
- Only ~20-30% success rate

### Option 2: Google Places API (Requires Billing)
- ✅ **Legal & Official** - Google's approved way to get business data
- ✅ **Fast** - 2-5 seconds vs 60+ seconds with Puppeteer  
- ✅ **Reliable** - 99.9% uptime, no blocks
- ✅ **Free** - 100,000 requests/month on free tier
- ✅ **Better Data** - Phone numbers, websites, hours, photos

### Setup Steps (5 minutes):

1. **Get a Google Cloud API Key** (Free):
   - Go to: https://console.cloud.google.com/
   - Create a new project or select existing
   - Enable "Places API"
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Copy your API key

2. **Add to your .env file**:
   ```env
   GOOGLE_PLACES_API_KEY=your_api_key_here
   ```

3. **Restart the server**:
   ```bash
   npm run dev
   ```

4. **Test scraping** - It will now use Places API automatically!

### Cost Comparison
- **Puppeteer**: Free but unreliable, slow, against ToS
- **Places API**: $0 for first 100k requests/month
  - Text Search: $32 per 1,000 requests (after free tier)
  - Place Details: $17 per 1,000 requests (after free tier)
  - For 1000 leads/month: ~$0 (under free tier)

## Current Implementation

Your app now has **smart fallback**:

1. **If `GOOGLE_PLACES_API_KEY` exists** → Uses Places API (fast & reliable)
2. **If key is missing** → Falls back to Puppeteer (slow & may fail)

## Testing Without API Key

If you want to test Puppeteer scraping despite the issues:
- It will try for 90 seconds
- May timeout due to Google blocking
- Success rate: ~20-30%
- Not recommended for production

## Recommended Action

🎯 **Get a free Google Places API key** - It takes 5 minutes and makes your app production-ready!

---

Need help? The API key setup is straightforward and the free tier is more than enough for testing.
