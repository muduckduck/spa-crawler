# SPA Crawler - Railway Deployment

Puppeteer-based SPA (Single Page Application) crawler server for extracting links and generating content hashes from JavaScript-heavy websites.

## Features

- 🚀 **SPA Support**: Fully renders JavaScript before extracting content
- 🔗 **Link Extraction**: `/crawl` - Extracts all links from SPA pages
- 🔐 **Content Hash**: `/hash` - Generates MD5 hash from rendered HTML
- 🐳 **Docker Ready**: Optimized Dockerfile for Railway deployment
- ⚡ **Express API**: Simple GET endpoints

## Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

1. Click the button above
2. Connect your GitHub repository
3. Railway will automatically detect the Dockerfile
4. Your service will be deployed with a public URL

## API Endpoints

### Root - Service Info

```bash
GET /
```

**Response:**
```json
{
  "status": "ok",
  "service": "SPA Crawler",
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
# Extract links from SPA page
curl "https://your-app.railway.app/crawl?url=https://www.epost.go.kr"

# Generate content hash
curl "https://your-app.railway.app/hash?url=https://www.epost.go.kr"
```

### JavaScript (fetch)

```javascript
// Extract links
const crawlResponse = await fetch(
  'https://your-app.railway.app/crawl?url=https://www.epost.go.kr'
);
const crawlData = await crawlResponse.json();
console.log('Links:', crawlData.links);

// Generate hash
const hashResponse = await fetch(
  'https://your-app.railway.app/hash?url=https://www.epost.go.kr'
);
const hashData = await hashResponse.json();
console.log('Hash:', hashData.hash);
```

### Integration Example

```javascript
const axios = require('axios');

const BASE_URL = 'https://your-app.railway.app';

// Check for duplicate pages using hash
async function isDuplicatePage(url, knownHashes) {
  const response = await axios.get(`${BASE_URL}/hash`, {
    params: { url }
  });
  
  const { hash } = response.data;
  return knownHashes.includes(hash);
}

// Extract all links from SPA
async function getAllLinks(url) {
  const response = await axios.get(`${BASE_URL}/crawl`, {
    params: { url }
  });
  
  return response.data.links;
}

// Usage
const mainUrl = 'https://www.epost.go.kr';
const links = await getAllLinks(mainUrl);
console.log(`Found ${links.length} links`);

const knownHashes = [];
for (const link of links) {
  const isDuplicate = await isDuplicatePage(link, knownHashes);
  if (!isDuplicate) {
    console.log('New page:', link);
    const response = await axios.get(`${BASE_URL}/hash`, { params: { url: link } });
    knownHashes.push(response.data.hash);
  }
}
```

## Local Development

### Install Dependencies

```bash
npm install
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

## Railway Configuration

The repository includes `railway.json` for Railway-specific configuration:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Environment Variables

Railway automatically sets:
- `PORT`: Server port (Railway provides this automatically)

No additional environment variables needed.

## Technical Details

### Browser Configuration

- Headless Chrome via Puppeteer
- 3-second wait for SPA rendering
- Network idle strategy
- Custom user agent
- 1920x1080 viewport
- 30-second timeout per page

### Performance

- Browser instance reused across requests
- Pages automatically closed after use
- Optimized for Railway's environment
- Automatic restart on failure

### Security

- Runs as non-root user in Docker
- No sandbox (required for Railway)
- Input validation on all endpoints

## Use Cases

1. **Duplicate Page Detection**: Use `/hash` to detect identical content
2. **SPA Link Extraction**: Use `/crawl` to get all links from JavaScript-rendered pages
3. **Web Quality Checking**: Integrate with quality checking tools
4. **Site Mapping**: Build site maps of SPA applications

## Limitations

- 30-second timeout per request
- Sequential processing (no concurrent requests)
- Memory usage scales with page complexity
- Not suitable for very large sites (use batch processing instead)

## Troubleshooting

### Railway Deployment Issues

1. **Build Fails**: Check Railway build logs for Puppeteer installation errors
2. **Timeout Errors**: Increase Railway's memory allocation (512MB+ recommended)
3. **Browser Crashes**: Railway free tier may have memory limits, upgrade if needed

### Local Development Issues

1. **Puppeteer Install Failed**: Run `npm install --unsafe-perm=true`
2. **Chrome Not Found**: Puppeteer will download Chrome automatically
3. **Permission Denied**: Run with proper permissions or use Docker

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

## License

MIT

## Author

Created for web quality checking and SPA site analysis with Railway deployment support.
