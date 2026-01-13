import { Request, Response, NextFunction } from 'express';
import { verifyToken, AuthUser } from './auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = user;
  next();
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  if (err.message === 'Invalid token') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.message === 'User already exists') {
    return res.status(409).json({ error: 'User already exists' });
  }

  if (err.message === 'Invalid email or password') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.status(500).json({ error: err.message || 'Internal server error' });
}
