import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { TranscriptService } from './services/transcript.service.js';
import { authenticateApiKey } from './middleware/auth.js';
import { rateLimiter } from './middleware/rateLimiter.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const transcriptService = new TranscriptService();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint (no authentication required)
app.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'healthy' });
});

// Agent instructions endpoint (no authentication required)
app.get('/api/agent', (_req: Request, res: Response): void => {
  const instructions = `# YouTube Transcript API - Agent Instructions

## Tool Definition
- **Name**: get_youtube_transcript
- **Description**: Fetches the full text transcript from a YouTube video

## Endpoint
\`\`\`
GET /api/transcript/:videoId
\`\`\`

## Authentication
\`\`\`
Header: X-API-Key: <your-api-key>
\`\`\`

## Parameters
| Name | Location | Required | Format | Description |
|------|----------|----------|--------|-------------|
| videoId | path | yes | 11 alphanumeric chars | YouTube video ID (e.g., dQw4w9WgXcQ) |

## Example Request
\`\`\`bash
curl -H "X-API-Key: YOUR_KEY" https://host/api/transcript/dQw4w9WgXcQ
\`\`\`

## Success Response (200)

**Headers:**
| Header | Type | Description |
|--------|------|-------------|
| Content-Type | string | Always \`text/plain\` |
| X-Video-Title | string | Title of the YouTube video |
| X-Video-Duration | number | Duration of the video in seconds |
| X-Video-Timestamp | string | ISO 8601 timestamp of when transcript was fetched |

**Body:** Plain text transcript of the video

## Error Responses
| Status | Meaning |
|--------|---------|
| 400 | Invalid video ID format |
| 401 | Missing or invalid API key |
| 404 | No transcript available for this video |
| 429 | Rate limit exceeded (retry after 30s) |
| 500 | Internal server error |

## Rate Limit
1 request per 30 seconds per API key. The rate limit is tracked by the X-API-Key header value.

## Usage Tips
- Extract the video ID from YouTube URLs: \`youtube.com/watch?v=VIDEO_ID\` or \`youtu.be/VIDEO_ID\`
- Video IDs are exactly 11 characters (alphanumeric, hyphens, underscores)
- Check the X-Video-Duration header to estimate transcript length
- Handle 404 errors gracefully - not all videos have transcripts available
`;

  res.setHeader('Content-Type', 'text/markdown');
  res.status(200).send(instructions);
});

// Transcript endpoint (authentication and rate limiting required)
app.get(
  '/api/transcript/:videoId',
  authenticateApiKey,
  rateLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { videoId } = req.params;

      // Validate video ID
      if (!videoId || videoId.trim().length === 0) {
        res.status(400).json({ error: 'Video ID is required' });
        return;
      }

      // Fetch transcript
      const result = await transcriptService.getTranscript(videoId);

      // Set response headers (encode title to handle special characters)
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('X-Video-Title', encodeURIComponent(result.title));
      res.setHeader('X-Video-Duration', result.duration.toString());
      res.setHeader('X-Video-Timestamp', result.timestamp);

      // Send plain text response
      res.status(200).send(result.text);
    } catch (error: any) {
      next(error);
    }
  }
);

// 404 handler for undefined routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // Handle specific error types
  if (err.message === 'No transcript available') {
    res.status(404).json({ error: 'No transcript available' });
    return;
  }

  // Handle timeout errors
  if (err.message?.includes('timeout') || err.message?.includes('ETIMEDOUT')) {
    res.status(504).json({ error: 'Request timeout' });
    return;
  }

  // Default to 500 for all other errors
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`API endpoint: http://localhost:${port}/api/transcript/:videoId`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
