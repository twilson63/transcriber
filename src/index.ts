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
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy' });
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

      // Set response headers
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('X-Video-Title', result.title);
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
