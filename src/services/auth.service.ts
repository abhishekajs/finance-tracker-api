import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthService {
  // Hash password before storing
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Compare password with hash
  static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT Tokens
  static generateTokens(userId: string) {
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  // Verify access token
  static verifyToken(token: string): { userId: string } {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  }

  // Register new user
  static async register(email: string, password: string, name: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password and create user
    const hashedPassword = await this.hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens,
    };
  }

  // Login user
  static async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid Credentials');
    }

    // Check Password
    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid Credentials');
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens,
    };
  }
}
