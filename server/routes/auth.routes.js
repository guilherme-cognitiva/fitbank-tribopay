import express from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    const result = await AuthService.login(email, password, ipAddress, userAgent);
    
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const user = AuthService.verifyRefreshToken(refreshToken);
    const tokens = AuthService.generateTokens(user);
    
    res.json(tokens);
  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

export default router;