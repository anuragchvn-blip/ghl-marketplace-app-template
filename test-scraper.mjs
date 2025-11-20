import puppeteer from 'puppeteer';

console.log('Testing Puppeteer and Google Maps scraping...\n');

async function testScraper() {
  try {
    console.log('1. Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
      ],
    });
    console.log('✓ Browser launched successfully!\n');

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log('2. Navigating to Google Maps...');
    const searchUrl = `https://www.google.com/maps/search/plumber+in+Miami,+FL`;
    
    await page.goto(searchUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    console.log('✓ Navigation successful!\n');

    console.log('3. Waiting for results feed...');
    await page.waitForSelector('div[role="feed"]', { timeout: 30000 });
    console.log('✓ Results feed loaded!\n');

    console.log('4. Extracting business data...');
    const results = await page.evaluate(() => {
      const elements = document.querySelectorAll('div[role="article"]');
      return elements.length;
    });
    console.log(`✓ Found ${results} business listings!\n`);

    await browser.close();
    console.log('✅ Test completed successfully!');
    console.log('\nYour scraper is working! Try it in the app now.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nFull error:', error);
  }
}

testScraper();
