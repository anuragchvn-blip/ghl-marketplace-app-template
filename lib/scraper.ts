import puppeteer, { Page } from 'puppeteer'

export interface BusinessLead {
  businessName: string
  category: string
  address: string
  city: string
  state: string
  zipCode: string
  phone?: string
  website?: string
  rating?: number
  reviewCount?: number
  latitude?: number
  longitude?: number
}

export class GoogleMapsScraper {
  async scrapeBusinesses(
    searchQuery: string,
    location: string,
    maxResults: number = 15
  ): Promise<BusinessLead[]> {
    let browser
    
    try {
      console.log('[Scraper] Launching browser with stealth mode...')
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled',
          '--window-size=1920,1080',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-web-security'
        ],
      })

      const page = await browser.newPage()
      
      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 })
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      // Remove webdriver flag
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        })
      })

      // Navigate to Google Maps
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(
        `${searchQuery} in ${location}`
      )}`
      
      console.log(`[Scraper] Navigating to: ${searchUrl}`)
      
      try {
        await page.goto(searchUrl, { 
          waitUntil: 'networkidle2',
          timeout: 90000 
        })
      } catch {
        // If navigation times out, try with domcontentloaded
        console.log('[Scraper] Retrying with domcontentloaded...')
        await page.goto(searchUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 60000 
        })
      }

      // Wait for page to stabilize
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Wait for results to load with extended timeout
      console.log('[Scraper] Waiting for results feed...')
      try {
        await page.waitForSelector('div[role="feed"]', { timeout: 30000 })
      } catch {
        // Try alternative selectors
        console.log('[Scraper] Trying alternative selector...')
        await page.waitForSelector('div[role="article"]', { timeout: 20000 })
      }

      // Scroll to load more results
      console.log('[Scraper] Scrolling to load more results...')
      await this.scrollResults(page, maxResults)

      // Extract business data
      console.log('[Scraper] Extracting business data...')
      const leads = await page.evaluate((max) => {
        const results: BusinessLead[] = []
        const elements = document.querySelectorAll('div[role="article"]')

        for (let i = 0; i < Math.min(elements.length, max); i++) {
          const el = elements[i]

          try {
            const nameEl = el.querySelector('div.fontHeadlineSmall')
            const categoryEl = el.querySelector('span.fontBodyMedium > span')
            const addressEl = el.querySelectorAll('div.fontBodyMedium')[1]
            const ratingEl = el.querySelector('span[role="img"]')

            const businessName = nameEl?.textContent?.trim() || ''
            const category = categoryEl?.textContent?.trim() || ''
            const fullAddress = addressEl?.textContent?.trim() || ''

            if (!businessName) continue

            // Parse address
            const addressParts = fullAddress.split(',').map((s) => s.trim())
            const address = addressParts[0] || ''
            const city = addressParts[1] || ''
            const stateZip = addressParts[2]?.split(' ') || []
            const state = stateZip[0] || ''
            const zipCode = stateZip[1] || ''

            // Parse rating
            const ratingText = ratingEl?.getAttribute('aria-label') || ''
            const ratingMatch = ratingText.match(/(\d+\.?\d*) stars/)
            const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined

            results.push({
              businessName,
              category,
              address,
              city,
              state,
              zipCode,
              rating,
            })
          } catch (err) {
            console.error('Error parsing business:', err)
          }
        }

        return results
      }, maxResults)

      console.log(`[Scraper] Successfully extracted ${leads.length} leads`)
      return leads
    } catch (error) {
      console.log('[Scraper] Error during scraping:', error)
      throw error
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  private async scrollResults(page: Page, targetCount: number) {
    const feedSelector = 'div[role="feed"]'
    let previousHeight = 0
    let scrollAttempts = 0
    const maxScrollAttempts = 10

    while (scrollAttempts < maxScrollAttempts) {
      const currentHeight = await page.evaluate((selector: string) => {
        const feed = document.querySelector(selector)
        return feed?.scrollHeight || 0
      }, feedSelector)

      if (currentHeight === previousHeight) {
        break
      }

      await page.evaluate((selector: string) => {
        const feed = document.querySelector(selector)
        if (feed) {
          feed.scrollTop = feed.scrollHeight
        }
      }, feedSelector)

      await new Promise(resolve => setTimeout(resolve, 2000))
      previousHeight = currentHeight
      scrollAttempts++

      // Check if we have enough results
      const resultCount = await page.evaluate(() => {
        return document.querySelectorAll('div[role="article"]').length
      })

      if (resultCount >= targetCount) {
        break
      }
    }
  }
}
