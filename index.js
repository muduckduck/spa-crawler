const express = require('express');
const puppeteer = require('puppeteer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Browser instance
let browser = null;

// Initialize browser
async function initBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
      ],
    });
    console.log('Browser initialized');
  }
  return browser;
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'SPA Crawler',
    endpoints: {
      crawl: '/crawl?url=<URL>',
      hash: '/hash?url=<URL>'
    },
    timestamp: new Date().toISOString() 
  });
});

// Crawl endpoint - Extract all links from SPA page
app.get('/crawl', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  console.log(`[${new Date().toISOString()}] Crawling: ${url}`);

  let page = null;
  try {
    const browserInstance = await initBrowser();
    page = await browserInstance.newPage();

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for SPA to render (3 seconds)
    await page.waitForTimeout(3000);

    // Extract all links
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors
        .map(a => {
          try {
            const href = a.href;
            // Only return absolute URLs
            if (href.startsWith('http://') || href.startsWith('https://')) {
              return href;
            }
            return null;
          } catch (e) {
            return null;
          }
        })
        .filter(href => href !== null)
        .filter((href, index, self) => self.indexOf(href) === index); // Remove duplicates
    });

    // Extract page info
    const title = await page.title();
    const finalUrl = page.url();

    console.log(`[${new Date().toISOString()}] Success: ${url} (${links.length} links found)`);

    res.json({
      success: true,
      url: finalUrl,
      title,
      links,
      linksCount: links.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error crawling ${url}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  } finally {
    if (page) {
      await page.close();
    }
  }
});

// Hash endpoint - Generate hash from rendered page
app.get('/hash', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  console.log(`[${new Date().toISOString()}] Hashing: ${url}`);

  let page = null;
  try {
    const browserInstance = await initBrowser();
    page = await browserInstance.newPage();

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for SPA to render (3 seconds)
    await page.waitForTimeout(3000);

    // Get rendered HTML
    const html = await page.content();

    // Generate hash (MD5)
    const hash = crypto.createHash('md5').update(html).digest('hex');

    // Extract page info
    const title = await page.title();
    const finalUrl = page.url();

    console.log(`[${new Date().toISOString()}] Success: ${url} (hash: ${hash})`);

    res.json({
      success: true,
      url: finalUrl,
      title,
      hash,
      htmlLength: html.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error hashing ${url}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  } finally {
    if (page) {
      await page.close();
    }
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing browser...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing browser...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SPA Crawler server listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/`);
  console.log(`Crawl endpoint: GET http://localhost:${PORT}/crawl?url=<URL>`);
  console.log(`Hash endpoint: GET http://localhost:${PORT}/hash?url=<URL>`);
});
