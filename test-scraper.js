// Simple test script to verify scraper works
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

async function testScraper() {
  console.log('🚀 Starting scraper test...')
  
  let browser
  try {
    console.log('📦 Launching browser...')
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1920,1080',
      ],
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    
    console.log('🌐 Navigating to Google Maps...')
    const searchUrl = 'https://www.google.com/maps/search/plumber+in+Miami,+FL'
    
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    })
    
    console.log('✅ Page loaded successfully!')
    
    // Wait a bit to see results
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Try to find results
    const feedExists = await page.$('div[role="feed"]')
    const articleExists = await page.$('div[role="article"]')
    
    console.log('📊 Results:')
    console.log('  - Feed element found:', !!feedExists)
    console.log('  - Article elements found:', !!articleExists)
    
    if (articleExists) {
      const count = await page.$$eval('div[role="article"]', els => els.length)
      console.log('  - Number of businesses:', count)
      
      // Extract first business name
      const firstName = await page.$eval(
        'div[role="article"] div.fontHeadlineSmall',
        el => el.textContent
      ).catch(() => null)
      
      if (firstName) {
        console.log('  - First business:', firstName)
      }
    }
    
    console.log('\n✨ Test completed! Press Ctrl+C to close.')
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 30000))
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    if (browser) {
      await browser.close()
      console.log('🔒 Browser closed')
    }
  }
}

testScraper()
