# SPA Crawler

Puppeteer-based SPA (Single Page Application) crawler server for extracting fully rendered HTML content and links from JavaScript-heavy websites.

## Features

- 🚀 **SPA Support**: Fully renders JavaScript before extracting content
- 🔗 **Link Extraction**: Automatically extracts all links from pages
- 📦 **Batch Processing**: Crawl multiple URLs in a single request
- 🐳 **Docker Ready**: Includes Dockerfile for easy deployment
- ⚡ **Express API**: RESTful API endpoints for easy integration

## Installation

### Local Development

```bash
# Install dependencies
npm install

# Start server
npm start

# Development mode (with auto-reload)
npm run dev
```

### Docker

```bash
# Build Docker image
docker build -t spa-crawler .

# Run container
docker run -p 3001:3001 spa-crawler

# Run with environment variables
docker run -p 3001:3001 -e PORT=3001 spa-crawler
```

## API Endpoints

### Health Check

```bash
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Single URL Crawl

```bash
POST /crawl
Content-Type: application/json

{
  "url": "https://example.com",
  "waitFor": 2000,
  "extractLinks": true
}
```

**Parameters:**
- `url` (required): URL to crawl
- `waitFor` (optional): Wait time in milliseconds after page load (default: 2000)
- `extractLinks` (optional): Extract all links from page (default: true)

**Response:**
```json
{
  "success": true,
  "url": "https://example.com",
  "title": "Example Domain",
  "html": "<!DOCTYPE html>...",
  "links": ["https://...", "https://..."],
  "linksCount": 42,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Batch Crawl

```bash
POST /crawl/batch
Content-Type: application/json

{
  "urls": [
    "https://example1.com",
    "https://example2.com"
  ],
  "waitFor": 2000,
  "extractLinks": false
}
```

**Parameters:**
- `urls` (required): Array of URLs to crawl
- `waitFor` (optional): Wait time in milliseconds after page load (default: 2000)
- `extractLinks` (optional): Extract all links from pages (default: false)

**Response:**
```json
{
  "success": true,
  "total": 2,
  "results": [
    {
      "success": true,
      "url": "https://example1.com",
      "title": "Example 1",
      "html": "<!DOCTYPE html>...",
      "links": [],
      "linksCount": 0
    },
    {
      "success": true,
      "url": "https://example2.com",
      "title": "Example 2",
      "html": "<!DOCTYPE html>...",
      "links": [],
      "linksCount": 0
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Usage Examples

### cURL

```bash
# Single page crawl
curl -X POST http://localhost:3001/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.epost.go.kr",
    "waitFor": 3000,
    "extractLinks": true
  }'

# Batch crawl
curl -X POST http://localhost:3001/crawl/batch \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example1.com",
      "https://example2.com"
    ],
    "waitFor": 2000
  }'
```

### JavaScript (axios)

```javascript
const axios = require('axios');

// Single page
const response = await axios.post('http://localhost:3001/crawl', {
  url: 'https://www.epost.go.kr',
  waitFor: 3000,
  extractLinks: true
});

console.log(response.data.html);
console.log(response.data.links);

// Batch
const batchResponse = await axios.post('http://localhost:3001/crawl/batch', {
  urls: [
    'https://example1.com',
    'https://example2.com'
  ],
  waitFor: 2000
});

batchResponse.data.results.forEach(result => {
  console.log(result.title, result.linksCount);
});
```

## Environment Variables

- `PORT`: Server port (default: 3001)

## Technical Details

### Browser Configuration

The server uses Puppeteer with the following optimizations:
- Headless mode
- No sandbox (for Docker compatibility)
- Disabled GPU and software rasterizer
- Custom user agent
- 1920x1080 viewport
- Network idle wait strategy

### Performance

- Browser instance is reused across requests
- Pages are automatically closed after crawling
- Graceful shutdown on SIGTERM/SIGINT

### Limitations

- 30-second timeout per page
- Sequential processing for batch requests
- Memory usage scales with concurrent requests

## Deployment

### Docker Compose

```yaml
version: '3.8'
services:
  spa-crawler:
    build: .
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Production Considerations

1. **Memory**: Allocate at least 1GB RAM for the container
2. **Timeout**: Adjust timeout based on target sites
3. **Rate Limiting**: Implement rate limiting for production use
4. **Monitoring**: Monitor memory usage and restart if needed
5. **Security**: Run behind a reverse proxy (nginx, Cloudflare)

## License

MIT

## Author

Created for web quality checking and SPA site analysis.
