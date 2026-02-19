const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Browser instance pool
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
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main crawl endpoint
app.post('/crawl', async (req, res) => {
  const { url, waitFor = 2000, extractLinks = true } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
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

    // Wait for additional time (for SPA to render)
    await page.waitForTimeout(waitFor);

    // Extract HTML content
    const html = await page.content();

    // Extract links if requested
    let links = [];
    if (extractLinks) {
      links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors
          .map(a => a.href)
          .filter(href => href.startsWith('http'))
          .filter((href, index, self) => self.indexOf(href) === index);
      });
    }

    // Extract page title
    const title = await page.title();

    // Get final URL (in case of redirects)
    const finalUrl = page.url();

    console.log(`[${new Date().toISOString()}] Success: ${url} (${links.length} links found)`);

    res.json({
      success: true,
      url: finalUrl,
      title,
      html,
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

// Batch crawl endpoint
app.post('/crawl/batch', async (req, res) => {
  const { urls, waitFor = 2000, extractLinks = false } = req.body;

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'URLs array is required' });
  }

  console.log(`[${new Date().toISOString()}] Batch crawling: ${urls.length} URLs`);

  const results = [];
  const browserInstance = await initBrowser();

  for (const url of urls) {
    let page = null;
    try {
      page = await browserInstance.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await page.waitForTimeout(waitFor);

      const html = await page.content();
      const title = await page.title();
      const finalUrl = page.url();

      let links = [];
      if (extractLinks) {
        links = await page.evaluate(() => {
          const anchors = Array.from(document.querySelectorAll('a[href]'));
          return anchors
            .map(a => a.href)
            .filter(href => href.startsWith('http'))
            .filter((href, index, self) => self.indexOf(href) === index);
        });
      }

      results.push({
        success: true,
        url: finalUrl,
        title,
        html,
        links,
        linksCount: links.length,
      });

      console.log(`[${new Date().toISOString()}] Success: ${url}`);

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error: ${url}:`, error.message);
      results.push({
        success: false,
        url,
        error: error.message,
      });
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  res.json({
    success: true,
    total: urls.length,
    results,
    timestamp: new Date().toISOString(),
  });
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
app.listen(PORT, () => {
  console.log(`SPA Crawler server listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Crawl endpoint: POST http://localhost:${PORT}/crawl`);
  console.log(`Batch crawl endpoint: POST http://localhost:${PORT}/crawl/batch`);
});
