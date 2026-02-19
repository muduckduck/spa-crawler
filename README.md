# SPA Crawler - Render Deployment (Playwright)

Playwright-based SPA (Single Page Application) crawler server for extracting links and generating content hashes from JavaScript-heavy websites. Optimized for Render deployment.

## Features

- 🚀 **SPA Support**: Fully renders JavaScript using Playwright Chromium
- 🔗 **Link Extraction**: `/crawl` - Extracts all links from SPA pages
- 🔐 **Content Hash**: `/hash` - Generates MD5 hash from rendered HTML
- 🐳 **Docker Ready**: Uses official Playwright Docker image
- ⚡ **Express API**: Simple GET endpoints with CORS support
- 🎭 **Playwright**: More reliable than Puppeteer for modern web apps

## Quick Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Manual Deployment

1. Fork/clone this repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `spa-crawler`
   - **Environment**: `Docker`
   - **Region**: Select your preferred region
   - **Instance Type**: Free (or paid for better performance)
6. Click "Create Web Service"
7. Render will automatically detect `Dockerfile` and deploy

Your service will be available at: `https://spa-crawler-xxx.onrender.com`

## API Endpoints

### Root - Service Info

```bash
GET /
```

**Response:**
```json
{
  "status": "ok",
  "service": "SPA Crawler (Playwright)",
  "endpoints": {
    "crawl": "/crawl?url=<URL>",
    "hash": "/hash?url=<URL>"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Crawl - Extract Links

```bash
GET /crawl?url=https://example.com
```

**Parameters:**
- `url` (required): URL to crawl

**Response:**
```json
{
  "success": true,
  "url": "https://example.com",
  "title": "Example Domain",
  "links": [
    "https://example.com/page1",
    "https://example.com/page2"
  ],
  "linksCount": 2,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Hash - Generate Content Hash

```bash
GET /hash?url=https://example.com
```

**Parameters:**
- `url` (required): URL to hash

**Response:**
```json
{
  "success": true,
  "url": "https://example.com",
  "title": "Example Domain",
  "hash": "5d41402abc4b2a76b9719d911017c592",
  "htmlLength": 1256,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Usage Examples

### cURL

```bash
# Service info
curl "https://spa-crawler-xxx.onrender.com/"

# Extract links from SPA page
curl "https://spa-crawler-xxx.onrender.com/crawl?url=https://www.epost.go.kr"

# Generate content hash
curl "https://spa-crawler-xxx.onrender.com/hash?url=https://www.epost.go.kr"
```

### JavaScript (fetch)

```javascript
const BASE_URL = 'https://spa-crawler-xxx.onrender.com';

// Extract links
const crawlResponse = await fetch(
  `${BASE_URL}/crawl?url=${encodeURIComponent('https://www.epost.go.kr')}`
);
const crawlData = await crawlResponse.json();
console.log('Links:', crawlData.links);

// Generate hash
const hashResponse = await fetch(
  `${BASE_URL}/hash?url=${encodeURIComponent('https://www.epost.go.kr')}`
);
const hashData = await hashResponse.json();
console.log('Hash:', hashData.hash);
```

### Integration with Web Quality Checker

```javascript
const axios = require('axios');

const CRAWLER_URL = 'https://spa-crawler-xxx.onrender.com';

// Extract links from SPA site
async function extractSpaLinks(baseUrl) {
  const response = await axios.get(`${CRAWLER_URL}/crawl`, {
    params: { url: baseUrl }
  });
  return response.data.links;
}

// Check for duplicate pages
async function isDuplicatePage(url, knownHashes) {
  const response = await axios.get(`${CRAWLER_URL}/hash`, {
    params: { url }
  });
  return knownHashes.has(response.data.hash);
}

// Usage
const mainUrl = 'https://www.epost.go.kr';
const links = await extractSpaLinks(mainUrl);
console.log(`Found ${links.length} links in SPA`);

const knownHashes = new Set();
for (const link of links.slice(0, 5)) {
  const response = await axios.get(`${CRAWLER_URL}/hash`, { 
    params: { url: link } 
  });
  
  if (!knownHashes.has(response.data.hash)) {
    console.log('Unique page:', link);
    knownHashes.add(response.data.hash);
  } else {
    console.log('Duplicate page:', link);
  }
}
```

## Local Development

### Install Dependencies

```bash
npm install
```

### Install Playwright Browsers

```bash
npx playwright install chromium
```

### Run Locally

```bash
npm start
# Server will start on http://localhost:3001
```

### Test Endpoints

```bash
# Health check
curl http://localhost:3001/

# Crawl a page
curl "http://localhost:3001/crawl?url=https://example.com"

# Generate hash
curl "http://localhost:3001/hash?url=https://example.com"
```

## Docker

### Build Image

```bash
docker build -t spa-crawler .
```

### Run Container

```bash
docker run -p 3001:3001 spa-crawler
```

### Test Container

```bash
curl "http://localhost:3001/crawl?url=https://example.com"
```

## Render Configuration

The repository includes `render.yaml` for Render Blueprint:

```yaml
services:
  - type: web
    name: spa-crawler
    env: docker
    plan: free
    dockerfilePath: ./Dockerfile
    envVars:
      - key: PORT
        value: 10000
```

## Environment Variables

Render automatically provides:
- `PORT`: Server port (default: 10000 on Render)

No additional configuration needed.

## Technical Details

### Playwright vs Puppeteer

**Why Playwright?**
- ✅ Official Docker images with all dependencies
- ✅ Better support for modern web frameworks
- ✅ More reliable page.goto() with 'networkidle'
- ✅ Better error handling
- ✅ Easier deployment on Render

### Browser Configuration

- Headless Chromium
- 3-second wait for SPA rendering
- Network idle wait strategy
- Custom user agent
- 30-second timeout per page

### Performance

- Browser instance reused across requests
- Contexts created per request (memory efficient)
- Pages automatically closed after use
- Optimized for Render's environment

### CORS

CORS is enabled for all origins to allow integration with any frontend.

## Render Free Tier Notes

**Limitations:**
- ⚠️ Service spins down after 15 minutes of inactivity
- ⚠️ First request after spin-down takes ~30-60 seconds (cold start)
- ⚠️ 750 hours/month free tier limit

**Recommendations:**
- Use paid plan for production (no spin-down)
- Implement retry logic for cold starts
- Keep service warm with periodic health checks

## Use Cases

1. **SPA Link Extraction**: Extract links from JavaScript-rendered sites
2. **Duplicate Detection**: Use hash endpoint to detect identical pages
3. **Web Quality Checking**: Integrate with quality checking tools
4. **Site Mapping**: Build site maps of SPA applications

## Troubleshooting

### Render Deployment Issues

**Build Fails:**
- Check Render build logs
- Ensure Dockerfile is correctly formatted
- Verify Playwright version compatibility

**Timeout Errors:**
- Increase timeout in code if needed
- Upgrade to paid plan for better resources

**Memory Issues:**
- Render free tier has 512MB RAM limit
- Consider upgrading for memory-intensive sites

### Local Development Issues

**Playwright Install Failed:**
```bash
# Install system dependencies first
npx playwright install-deps chromium
npx playwright install chromium
```

**Permission Denied:**
```bash
# Run with Docker instead
docker-compose up
```

## Comparison with Railway

| Feature | Render (Playwright) | Railway (Puppeteer) |
|---------|---------------------|---------------------|
| **Free Tier** | 750h/month, spin-down | $5 credit/month |
| **Docker Support** | ✅ Native | ✅ Native |
| **Cold Start** | ~30-60s | Minimal |
| **Reliability** | High | High |
| **Best For** | Production apps | Development/testing |

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

## License

MIT

## Author

Created for web quality checking and SPA site analysis with Render deployment support.
