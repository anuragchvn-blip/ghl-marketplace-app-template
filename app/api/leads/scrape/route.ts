import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoogleMapsScraper, BusinessLead } from '@/lib/scraper'
import { GooglePlacesScraper } from '@/lib/places-scraper'
import { OutscraperScraper } from '@/lib/outscraper-scraper'
import { SerpAPIScraper } from '@/lib/serpapi-scraper'
import { MockScraper } from '@/lib/mock-scraper'
import { AIScorer } from '@/lib/ai-scorer'
import { getGHLSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated GHL user
    const session = await getGHLSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check day pass status
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        dayPassActive: true,
        dayPassExpiresAt: true,
        dayPassLeadsUsed: true,
        dayPassLeadsLimit: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Validate day pass
    if (!user.dayPassActive || !user.dayPassExpiresAt || user.dayPassExpiresAt < new Date()) {
      return NextResponse.json(
        { error: 'No active day pass. Please purchase a day pass to scrape leads.' },
        { status: 403 }
      )
    }

    if (user.dayPassLeadsUsed >= user.dayPassLeadsLimit) {
      return NextResponse.json(
        { error: 'Daily lead limit reached. Please purchase a new day pass.' },
        { status: 403 }
      )
    }

    const currentUserId = session.userId
    const { searchQuery, location, maxResults = 15 } = await request.json()

    if (!searchQuery || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let scrapedLeads: BusinessLead[] = []
    let scrapingMethod = 'unknown'

    // Priority order of scraping methods:
    
    // 1. Try SerpAPI (FREE - 100 searches/month, reliable!)
    if (process.env.SERPAPI_KEY) {
      try {
        console.log('[API] Using SerpAPI (free tier - recommended)')
        const serpApiScraper = new SerpAPIScraper()
        scrapedLeads = await serpApiScraper.scrapeBusinesses(searchQuery, location, maxResults)
        scrapingMethod = 'serpapi'
      } catch (serpApiError) {
        console.log('[API] SerpAPI failed:', serpApiError)
      }
    }

    // 2. Try Outscraper API (requires credit card)
    if (scrapedLeads.length === 0 && process.env.OUTSCRAPER_API_KEY) {
      try {
        console.log('[API] Using Outscraper API')
        const outscraperScraper = new OutscraperScraper()
        scrapedLeads = await outscraperScraper.scrapeBusinesses(searchQuery, location, maxResults)
        scrapingMethod = 'outscraper'
      } catch (outscraperError) {
        console.log('[API] Outscraper failed:', outscraperError)
      }
    }

    // 3. Try Google Places API (requires billing setup)
    if (scrapedLeads.length === 0 && process.env.GOOGLE_PLACES_API_KEY) {
      try {
        console.log('[API] Using Google Places API')
        const placesScraper = new GooglePlacesScraper()
        scrapedLeads = await placesScraper.scrapeBusinesses(searchQuery, location, maxResults)
        scrapingMethod = 'google_places'
      } catch (placesError) {
        console.log('[API] Places API failed:', placesError)
      }
    }

    // 4. Try Puppeteer scraping (may be blocked by Google)
    if (scrapedLeads.length === 0 && process.env.USE_PUPPETEER === 'true') {
      try {
        console.log('[API] Using Puppeteer scraping (may timeout)')
        const scraper = new GoogleMapsScraper()
        scrapedLeads = await scraper.scrapeBusinesses(searchQuery, location, maxResults)
        scrapingMethod = 'puppeteer'
      } catch (puppeteerError) {
        console.log('[API] Puppeteer failed:', puppeteerError)
      }
    }

    // 5. Use Mock Scraper for testing (fallback - always works)
    if (scrapedLeads.length === 0) {
      console.log('[API] Using Mock Scraper (testing mode)')
      const mockScraper = new MockScraper()
      scrapedLeads = await mockScraper.scrapeBusinesses(searchQuery, location, maxResults)
      scrapingMethod = 'mock'
    }

    if (scrapedLeads.length === 0) {
      return NextResponse.json({ error: 'No leads found' }, { status: 404 })
    }

    // Stream the results
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const aiScorer = new AIScorer()
        
        // Send initial metadata
        const metaData = JSON.stringify({ 
          type: 'meta', 
          totalScraped: scrapedLeads.length, 
          scrapingMethod 
        })
        controller.enqueue(encoder.encode(metaData + '\n'))

        // Process in batches to manage concurrency
        const BATCH_SIZE = 5
        for (let i = 0; i < scrapedLeads.length; i += BATCH_SIZE) {
          const batch = scrapedLeads.slice(i, i + BATCH_SIZE)
          
          await Promise.all(batch.map(async (lead: BusinessLead) => {
            try {
              const scoringResult = await aiScorer.scoreLeadQuality(lead)

              // Only save and return leads with score >= 75
              if (scoringResult.score >= 75) {
                // Check if user has reached their limit
                const currentUser = await prisma.user.findUnique({
                  where: { id: currentUserId },
                  select: { dayPassLeadsUsed: true, dayPassLeadsLimit: true },
                })

                if (currentUser && currentUser.dayPassLeadsUsed >= currentUser.dayPassLeadsLimit) {
                  return // Skip this lead, limit reached
                }

                // Check for existing lead to avoid duplicates
                const existingLead = await prisma.lead.findFirst({
                  where: {
                    businessName: lead.businessName,
                    address: lead.address,
                  }
                })

                let savedLead
                const leadDataToSave = {
                  userId: currentUserId,
                  businessName: lead.businessName,
                  category: lead.category,
                  address: lead.address,
                  city: lead.city,
                  state: lead.state,
                  zipCode: lead.zipCode,
                  phone: lead.phone,
                  website: lead.website,
                  rating: lead.rating,
                  reviewCount: lead.reviewCount,
                  latitude: lead.latitude,
                  longitude: lead.longitude,
                  aiScore: scoringResult.score,
                  aiReasoning: scoringResult.reasoning,
                  status: 'NEW',
                }

                if (existingLead) {
                  savedLead = await prisma.lead.update({
                    where: { id: existingLead.id },
                    data: leadDataToSave,
                  })
                } else {
                  savedLead = await prisma.lead.create({
                    data: leadDataToSave,
                  })
                }

                // Increment user's leads used count
                await prisma.user.update({
                  where: { id: currentUserId },
                  data: { dayPassLeadsUsed: { increment: 1 } },
                })

                const leadData = JSON.stringify({
                  type: 'lead',
                  data: {
                    ...savedLead,
                    scoringFactors: scoringResult.keyFactors,
                  }
                })
                controller.enqueue(encoder.encode(leadData + '\n'))
              }
            } catch (err) {
              console.error('Error processing lead:', err)
            }
          }))
        }
        
        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Scrape Error:', error)
    return NextResponse.json(
      { error: 'Failed to scrape leads' },
      { status: 500 }
    )
  }
}
