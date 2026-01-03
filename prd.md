# Product Requirements Document: YouTube Transcript API

## Overview

A stateless REST API web service that accepts a YouTube video ID and returns the plain text transcript of the video using YouTube's built-in captions/subtitles.

## Project Details

- **Technology Stack**: Node.js, TypeScript
- **Architecture**: Stateless web service
- **Deployment Target**: render.com
- **API Type**: REST API

## Core Functionality

### Primary Feature

The service provides a single endpoint that:
- Accepts a YouTube video ID as input
- Retrieves the video's built-in captions/subtitles from YouTube
- Returns the transcript as plain text
- Includes video metadata in HTTP response headers

## API Specification

### Endpoint

```
GET /api/transcript/:videoId
```

**Parameters:**
- `videoId` (path parameter): YouTube video ID (e.g., "dQw4w9WgXcQ")

**Headers (Request):**
- `X-API-Key`: Master API key for authentication (required)

**Headers (Response):**
- `X-Video-Title`: Title of the YouTube video
- `X-Video-Duration`: Duration of the video in seconds
- `X-Video-Timestamp`: ISO 8601 timestamp when the transcript was retrieved
- `Content-Type`: text/plain

**Response Body:**
- Plain text transcript of the video

### Example Request

```bash
curl -H "X-API-Key: your-master-api-key" \
  https://api.example.com/api/transcript/dQw4w9WgXcQ
```

### Example Success Response

```
HTTP/1.1 200 OK
Content-Type: text/plain
X-Video-Title: Example Video Title
X-Video-Duration: 180
X-Video-Timestamp: 2026-01-02T10:30:00.000Z

This is the transcript of the video.
It appears as plain text with all the spoken content.
Each line represents the captions as they appear in the video.
```

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Invalid or missing API key"
}
```

#### 404 Not Found
```json
{
  "error": "No transcript available"
}
```

Returned when:
- Video has no captions/subtitles available
- Video is private or unavailable
- Video ID is invalid

#### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Non-Functional Requirements

### Security

1. **Authentication**: Master API key authentication via `X-API-Key` header
   - API key should be configured via environment variable
   - Requests without valid API key should return 401 Unauthorized

2. **Environment Variables**:
   - `API_KEY`: Master API key for authentication
   - `PORT`: Server port (default: 3000)
   - `NODE_ENV`: Environment (development/production)

### Performance

1. **Rate Limiting**: 
   - 1 request per 30 seconds per API key
   - Return 429 status code when limit exceeded
   - Include `Retry-After` header with seconds until next allowed request

2. **Timeout**:
   - Maximum 30 seconds for YouTube API requests
   - Return appropriate error if timeout occurs

3. **Stateless Design**:
   - No session storage
   - No database required
   - Each request is independent
   - Horizontally scalable

### Reliability

1. **Error Handling**:
   - Graceful handling of YouTube API failures
   - Clear error messages for all failure scenarios
   - Logging of errors for debugging

2. **Health Check**:
   - Endpoint: `GET /health`
   - Returns 200 OK with `{"status": "healthy"}` when service is operational

## Technical Requirements

### Language Support

- English transcripts only
- Request English captions from YouTube API
- If English captions not available, return 404 with "No transcript available"

### Transcript Format

- Plain text only (no formatting, no timestamps in body)
- Newlines preserved as they appear in captions
- No HTML, no markdown
- UTF-8 encoding

### Dependencies

Expected libraries:
- Express.js or similar for HTTP server
- YouTube transcript fetching library (e.g., `youtube-transcript`, `youtubei.js`)
- Rate limiting middleware
- Environment variable management (dotenv)

### Code Quality

- TypeScript with strict mode enabled
- Proper type definitions for all functions
- ESLint configuration for code consistency
- Unit tests for core functionality
- Integration tests for API endpoints

## Deployment

### Platform
- render.com web service

### Configuration
- Environment variables configured in Render dashboard
- Automatic deployments from main branch
- Health check endpoint configured for monitoring

### Scaling
- Stateless design allows horizontal scaling
- No persistent storage required
- Each instance operates independently

## Out of Scope (V1)

- User authentication (beyond master API key)
- Database or caching layer
- Transcript generation via speech-to-text
- Support for languages other than English
- Webhook notifications
- Batch processing of multiple videos
- Transcript search or indexing
- Video downloading or storage

## Success Metrics

1. API responds within 5 seconds for 95% of requests
2. 99% uptime
3. Successful retrieval of transcripts for all videos with English captions
4. Zero unauthorized access incidents

## Future Considerations (V2+)

- Multiple language support with language parameter
- Caching layer (Redis) for frequently requested transcripts
- Multiple API key support with per-key rate limits
- Webhook support for async processing
- Batch endpoint for multiple video IDs
- Transcript formatting options (JSON, SRT, VTT)
- Analytics and usage tracking
