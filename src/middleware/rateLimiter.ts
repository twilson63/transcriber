import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Configuration options for the rate limiter
 */
interface RateLimiterConfig {
  /** Maximum number of requests allowed within the time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Error message to return when rate limit is exceeded */
  message: string;
  /** HTTP status code to return when rate limit is exceeded */
  statusCode: number;
}

/**
 * Default rate limiter configuration
 */
const rateLimiterConfig: RateLimiterConfig = {
  maxRequests: 1,
  windowMs: 30 * 1000, // 30 seconds
  message: 'Rate limit exceeded. Please try again later.',
  statusCode: 429,
};

/**
 * Custom key generator that uses X-API-Key header as the identifier
 * @param req - Express request object
 * @returns The API key from the X-API-Key header or 'unknown' if not present
 */
const keyGenerator = (req: Request): string => {
  const apiKey = req.headers['x-api-key'];
  
  if (typeof apiKey === 'string') {
    return apiKey;
  }
  
  if (Array.isArray(apiKey)) {
    return apiKey[0] || 'unknown';
  }
  
  return 'unknown';
};

/**
 * Custom handler for when rate limit is exceeded
 * @param _req - Express request object
 * @param res - Express response object
 */
const handler = (_req: Request, res: Response): void => {
  const retryAfter = Math.ceil(rateLimiterConfig.windowMs / 1000);
  
  res.status(rateLimiterConfig.statusCode)
    .set('Retry-After', retryAfter.toString())
    .json({
      error: rateLimiterConfig.message,
    });
};

/**
 * Rate limiter options configuration
 */
const rateLimiterOptions: Partial<Options> = {
  windowMs: rateLimiterConfig.windowMs,
  max: rateLimiterConfig.maxRequests,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator,
  handler,
  skipSuccessfulRequests: false, // Count all requests
  skipFailedRequests: false, // Count all requests
};

/**
 * Rate limiter middleware
 * 
 * Limits requests to 1 per 30 seconds per API key (identified by X-API-Key header)
 * Returns 429 status code with Retry-After header when limit is exceeded
 */
export const rateLimiter: RateLimitRequestHandler = rateLimit(rateLimiterOptions);

/**
 * Export configuration for testing or customization
 */
export { rateLimiterConfig, rateLimiterOptions };
