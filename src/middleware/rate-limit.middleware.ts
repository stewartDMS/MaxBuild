import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Custom handler for rate limit exceeded - returns JSON response
 */
const rateLimitHandler = (message: string) => (req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    error: {
      message,
      reason: 'RATE_LIMIT_EXCEEDED',
      details: {
        suggestion: 'Please wait before making more requests',
      },
    },
  });
};

/**
 * Rate limiter for file upload endpoints
 * Limits to 10 uploads per 15 minutes per IP
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  handler: rateLimitHandler('Too many file uploads from this IP, please try again later.'),
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * General API rate limiter
 * Limits to 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  handler: rateLimitHandler('Too many requests from this IP, please try again later.'),
  standardHeaders: true,
  legacyHeaders: false,
});
