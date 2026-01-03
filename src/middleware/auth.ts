import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to authenticate API requests using X-API-Key header
 */
export const authenticateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.header('X-API-Key');
  const validApiKey = process.env.API_KEY;

  // Check if API key is configured
  if (!validApiKey) {
    console.error('API_KEY environment variable not set');
    res.status(500).json({ error: 'Internal server error' });
    return;
  }

  // Check if API key is provided
  if (!apiKey) {
    res.status(401).json({ error: 'Invalid or missing API key' });
    return;
  }

  // Validate API key
  if (apiKey !== validApiKey) {
    res.status(401).json({ error: 'Invalid or missing API key' });
    return;
  }

  // API key is valid, proceed to next middleware
  next();
};
