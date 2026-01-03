# YouTube Transcript API

A stateless REST API service that retrieves plain text transcripts from YouTube videos using built-in captions/subtitles. Built with Node.js, TypeScript, and Express.

## Features

- Fetch transcripts from any YouTube video with available captions
- Simple REST API with a single endpoint
- API key authentication for secure access
- Rate limiting (1 request per 30 seconds per API key)
- Video metadata in response headers (title, duration, timestamp)
- Comprehensive error handling
- Stateless architecture for horizontal scalability
- Health check endpoint for monitoring
- Docker support for containerized deployment
- Production-ready with TypeScript strict mode

## Prerequisites

- Node.js 20.x or higher
- npm or yarn package manager
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) installed and available in PATH

## Installation

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd transcriber
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
touch .env
```

4. Add the following environment variables to `.env`:
```env
PORT=3000
NODE_ENV=development
API_KEY=your-master-api-key-here
```

## Configuration

### Environment Variables

The application requires the following environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port number | `3000` | No |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` | No |
| `API_KEY` | Master API key for authentication | - | Yes |

### Example `.env` File

```env
PORT=3000
NODE_ENV=development
API_KEY=my-secret-api-key-123
```

## Running the Application

### Development Mode

Start the development server with hot reloading:

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or your configured PORT).

### Production Mode

1. Build the TypeScript code:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

### Using Docker

1. Build the Docker image:
```bash
docker build -t youtube-transcript-api .
```

2. Run the container:
```bash
docker run -p 3000:3000 -e API_KEY=your-api-key -e NODE_ENV=production youtube-transcript-api
```

## API Documentation

### Base URL

```
http://localhost:3000
```

### Authentication

All transcript API requests require authentication using the `X-API-Key` header.

**Header:**
```
X-API-Key: your-master-api-key
```

### Endpoints

#### 1. Get Video Transcript

Retrieves the plain text transcript for a YouTube video.

**Endpoint:**
```
GET /api/transcript/:videoId
```

**Path Parameters:**
- `videoId` (string, required): YouTube video ID (11 characters, e.g., "dQw4w9WgXcQ")

**Request Headers:**
- `X-API-Key` (string, required): Your API key for authentication

**Success Response (200 OK):**

Headers:
```
Content-Type: text/plain
X-Video-Title: Video Title
X-Video-Duration: 180
X-Video-Timestamp: 2026-01-02T10:30:00.000Z
```

Body:
```
This is the full transcript of the video.
All spoken content appears as plain text.
Newlines are preserved as they appear in the captions.
```

**Example Request:**
```bash
curl -H "X-API-Key: your-api-key" \
  http://localhost:3000/api/transcript/dQw4w9WgXcQ
```

**Example with error handling:**
```bash
curl -i -H "X-API-Key: your-api-key" \
  http://localhost:3000/api/transcript/dQw4w9WgXcQ
```

#### 2. Agent Instructions

Returns markdown instructions for AI agents to use this API as a tool.

**Endpoint:**
```
GET /api/agent
```

**Authentication:** Not required (public endpoint)

**Success Response (200 OK):**

Headers:
```
Content-Type: text/markdown
```

Body: Markdown document with tool definition, parameters, examples, and error handling instructions.

**Example Request:**
```bash
curl http://localhost:3000/api/agent
```

#### 3. Health Check

Check if the service is running and healthy.

**Endpoint:**
```
GET /health
```

**Success Response (200 OK):**
```json
{
  "status": "healthy"
}
```

**Example Request:**
```bash
curl http://localhost:3000/health
```

### Error Responses

All error responses return JSON with an `error` field describing the issue.

#### 400 Bad Request

Invalid video ID format.

```json
{
  "error": "Invalid YouTube video ID format: abc123"
}
```

**Example:**
```bash
curl -H "X-API-Key: your-api-key" \
  http://localhost:3000/api/transcript/invalid-id
```

#### 401 Unauthorized

Missing or invalid API key.

```json
{
  "error": "Invalid or missing API key"
}
```

**Example:**
```bash
curl http://localhost:3000/api/transcript/dQw4w9WgXcQ
# or
curl -H "X-API-Key: wrong-key" \
  http://localhost:3000/api/transcript/dQw4w9WgXcQ
```

#### 404 Not Found

Video not found or no captions available.

```json
{
  "error": "No captions available for video: dQw4w9WgXcQ"
}
```

Returned when:
- Video has no captions/subtitles available
- Video is private, deleted, or unavailable
- Video ID does not exist

**Example:**
```bash
curl -H "X-API-Key: your-api-key" \
  http://localhost:3000/api/transcript/invalidvideo
```

#### 429 Too Many Requests

Rate limit exceeded.

```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

Headers:
```
Retry-After: 30
RateLimit-Limit: 1
RateLimit-Remaining: 0
RateLimit-Reset: <timestamp>
```

**Example:**
```bash
# First request - succeeds
curl -H "X-API-Key: your-api-key" \
  http://localhost:3000/api/transcript/dQw4w9WgXcQ

# Second request within 30 seconds - fails with 429
curl -H "X-API-Key: your-api-key" \
  http://localhost:3000/api/transcript/dQw4w9WgXcQ
```

#### 500 Internal Server Error

Server encountered an unexpected error.

```json
{
  "error": "Internal server error"
}
```

**Example scenario:**
```bash
# Network timeout or YouTube API issues
curl -H "X-API-Key: your-api-key" \
  http://localhost:3000/api/transcript/dQw4w9WgXcQ
```

### Response Headers

All successful transcript responses include the following headers:

| Header | Type | Description |
|--------|------|-------------|
| `Content-Type` | string | Always `text/plain` for transcript responses |
| `X-Video-Title` | string | Title of the YouTube video |
| `X-Video-Duration` | number | Duration of the video in seconds |
| `X-Video-Timestamp` | string | ISO 8601 timestamp when transcript was retrieved |

### Rate Limiting

The API implements rate limiting to prevent abuse:

- **Limit:** 1 request per 30 seconds per API key
- **Identification:** Based on `X-API-Key` header
- **Behavior:** Returns `429 Too Many Requests` when limit exceeded
- **Headers:** Rate limit information in `RateLimit-*` headers
- **Retry:** `Retry-After` header indicates seconds until next allowed request

**Rate Limit Headers:**
- `RateLimit-Limit`: Maximum requests allowed in the time window (1)
- `RateLimit-Remaining`: Number of requests remaining (0 or 1)
- `RateLimit-Reset`: Timestamp when the rate limit resets
- `Retry-After`: Seconds to wait before retrying (only on 429 responses)

**Example:**
```bash
# Check rate limit headers
curl -i -H "X-API-Key: your-api-key" \
  http://localhost:3000/api/transcript/dQw4w9WgXcQ

# Response includes:
# RateLimit-Limit: 1
# RateLimit-Remaining: 0
# RateLimit-Reset: 1735862430
```

## Deployment

### Deploying to Render.com

This application is configured for easy deployment on Render.com using the included `render.yaml` blueprint.

#### Prerequisites
- Render.com account
- GitHub repository with this code

#### Deployment Steps

1. **Connect Repository:**
   - Log in to [Render.com](https://render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository

2. **Configure Blueprint:**
   - Render will automatically detect `render.yaml`
   - Review the configuration:
     - Service type: Web Service
     - Runtime: Node
     - Build command: `npm install && npm run build`
     - Start command: `npm start`
     - Health check: `/health`

3. **Set Environment Variables:**
   - In the Render dashboard, set the following environment variables:
     - `API_KEY`: Your master API key (keep this secret!)
     - `PORT`: Leave blank (Render sets this automatically)
     - `NODE_ENV`: Set to `production`

4. **Deploy:**
   - Click "Apply" to create the service
   - Render will automatically build and deploy your application
   - The service will be available at: `https://your-service-name.onrender.com`

#### Auto-Deploy

The `render.yaml` configuration enables automatic deployments:
- Every push to the main branch triggers a new deployment
- Health checks monitor the `/health` endpoint
- Failed deployments automatically roll back

#### Manual Deployment

Alternatively, deploy manually without blueprint:

1. Create a new Web Service on Render
2. Connect your repository
3. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node
4. Add environment variables
5. Deploy

#### Post-Deployment

Test your deployed API:

```bash
# Health check
curl https://your-service-name.onrender.com/health

# Get transcript
curl -H "X-API-Key: your-api-key" \
  https://your-service-name.onrender.com/api/transcript/dQw4w9WgXcQ
```

#### Monitoring

- Monitor health checks in Render dashboard
- View logs in real-time via Render's log viewer
- Set up alerts for downtime or errors

### Other Deployment Platforms

#### Docker Deployment

The included `Dockerfile` allows deployment to any Docker-compatible platform. Note that the Docker image must include yt-dlp:

```bash
# Build
docker build -t youtube-transcript-api .

# Run
docker run -p 3000:3000 \
  -e API_KEY=your-api-key \
  -e NODE_ENV=production \
  youtube-transcript-api
```

Suitable for:
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform
- Kubernetes clusters

#### Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set API_KEY=your-api-key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

#### Vercel/Netlify

While possible, these serverless platforms may require adaptation of the Express server to serverless functions.

## Project Structure

```
transcriber/
├── src/
│   ├── index.ts                 # Main application entry point
│   ├── middleware/
│   │   ├── auth.ts             # API key authentication middleware
│   │   └── rateLimiter.ts      # Rate limiting middleware
│   └── services/
│       └── transcript.service.ts # YouTube transcript fetching via yt-dlp
├── dist/                        # Compiled JavaScript (generated)
├── node_modules/               # Dependencies (generated)
├── .env                        # Environment variables (not in repo)
├── .eslintrc.json             # ESLint configuration
├── .gitignore                 # Git ignore rules
├── .prettierrc                # Prettier code formatting
├── Dockerfile                 # Docker container configuration
├── package.json               # Node.js dependencies and scripts
├── package-lock.json          # Locked dependency versions
├── prd.md                     # Product requirements document
├── README.md                  # This file
├── render.yaml                # Render.com deployment blueprint
└── tsconfig.json              # TypeScript configuration
```

### Key Files

#### `src/index.ts`
Main Express application server. Configures middleware, routes, and starts the HTTP server.

#### `src/middleware/rateLimiter.ts`
Rate limiting middleware that restricts requests to 1 per 30 seconds per API key.

#### `src/middleware/auth.ts`
API key authentication middleware. Validates the `X-API-Key` header against the configured `API_KEY` environment variable.

#### `src/services/transcript.service.ts`
Core service for fetching YouTube transcripts using yt-dlp. Includes:
- Video ID validation (11-character alphanumeric format)
- Transcript fetching via yt-dlp with 30-second timeout
- JSON3 subtitle format parsing
- Video metadata extraction (title, duration)
- Automatic temp file cleanup

#### `Dockerfile`
Multi-stage Docker build configuration for production deployment.

#### `render.yaml`
Render.com blueprint for automated deployment and configuration.

#### `tsconfig.json`
TypeScript compiler configuration with strict mode enabled for type safety.

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20.x | Runtime environment |
| **TypeScript** | ^5.x | Type-safe JavaScript |
| **Express.js** | ^4.x | Web framework |

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `express` | HTTP server and routing |
| `express-rate-limit` | Rate limiting middleware |
| `cors` | Cross-origin resource sharing |
| `dotenv` | Environment variable management |
| `yt-dlp` (system) | Fetch YouTube video subtitles |

### Development Tools

| Tool | Purpose |
|------|---------|
| `typescript` | TypeScript compiler |
| `@types/express` | TypeScript definitions for Express |
| `eslint` | Code linting and style enforcement |
| `@typescript-eslint/*` | TypeScript-specific ESLint rules |
| `prettier` | Code formatting |
| `nodemon` | Development server with auto-reload |

### Infrastructure

| Component | Technology |
|-----------|-----------|
| **Containerization** | Docker |
| **Deployment** | Render.com (recommended) |
| **CI/CD** | GitHub Actions (optional) |

### Architecture Principles

- **Stateless Design:** No database or session storage required
- **RESTful API:** Standard HTTP methods and status codes
- **Error Handling:** Comprehensive error types and messages
- **Type Safety:** TypeScript strict mode for compile-time safety
- **Scalability:** Horizontal scaling via stateless architecture
- **Security:** API key authentication and rate limiting
- **Monitoring:** Health check endpoint for uptime monitoring

## Scripts

Available npm scripts:

```bash
# Development
npm run dev          # Start development server with hot reload

# Production
npm run build        # Compile TypeScript to JavaScript
npm start            # Run production server (requires build first)

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm test             # Run tests (if configured)
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

ISC

## Support

For issues or questions, please open an issue in the GitHub repository.

---

**Version:** 1.0.0  
**Last Updated:** January 2026
