import express from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({
        message: 'Email, password and name are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
      });
    }

    // Register user
    const result = await AuthService.register(email, password, name);

    res.status(201).json({
      message: 'User registered successfully',
      ...result,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage === 'User already exists') {
      return res.status(409).json({ message: errorMessage });
    }

    console.error('Registration error: ', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    // Login user
    const result = await AuthService.login(email, password);

    res.status(200).json({
      message: 'Login successful',
      ...result,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage === 'Invalid Credentials') {
      return res.status(401).json({ message: errorMessage });
    }

    console.error('Login error: ', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
    const userId = (decoded as { userId: string }).userId;

    // Generate new access tokens
    const tokens = AuthService.generateTokens(userId);

    res.status(200).json({
      message: 'Token refreshed successflly',
      accessToken: tokens.accessToken,
    });
  } catch (error: unknown) {
    console.error('Token refresh error: ', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

export default router;
