import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

export const pixOutLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 PIX OUT requests per 5 minutes
  message: 'Too many PIX OUT requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

export const balanceRefreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 balance refresh requests per minute
  message: 'Too many balance refresh requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});