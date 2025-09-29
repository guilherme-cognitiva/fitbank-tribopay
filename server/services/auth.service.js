import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/database.js';
import { AuditService } from './audit.service.js';

export class AuthService {
  static async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  static generateTokens(user) {
    const payload = { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { 
      expiresIn: '1h' 
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { 
      expiresIn: '7d' 
    });

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  static verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  }

  static async login(email, password, ipAddress, userAgent) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        await AuditService.log(null, 'LOGIN_FAILED', 'user', null, ipAddress, userAgent, { email, reason: 'user_not_found' });
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await this.verifyPassword(password, user.password_hash);
      
      if (!isValidPassword) {
        await AuditService.log(user.id, 'LOGIN_FAILED', 'user', user.id, ipAddress, userAgent, { email, reason: 'invalid_password' });
        throw new Error('Invalid credentials');
      }

      const tokens = this.generateTokens(user);
      
      await AuditService.log(user.id, 'LOGIN_SUCCESS', 'user', user.id, ipAddress, userAgent, { email });

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        ...tokens
      };
    } catch (error) {
      throw error;
    }
  }

  static async createUser(email, password, createdBy, ipAddress, userAgent) {
    try {
      const passwordHash = await this.hashPassword(password);

      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email,
          password_hash: passwordHash,
          role: 'admin'
        })
        .select()
        .single();

      if (error) throw error;

      await AuditService.log(createdBy, 'USER_CREATED', 'user', user.id, ipAddress, userAgent, { email });

      return {
        id: user.id,
        email: user.email,
        role: user.role
      };
    } catch (error) {
      throw error;
    }
  }
}