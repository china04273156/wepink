import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDatabase } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
const JWT_EXPIRY = '7d';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function registerUser(email: string, password: string, name: string): Promise<AuthUser> {
  const db = await getDatabase();

  // Verificar se usuário já existe
  const existingUser = await db.select().from(users).where(eq(users.email, email));
  if (existingUser.length > 0) {
    throw new Error('User already exists');
  }

  const hashedPassword = await hashPassword(password);

  const result = await db.insert(users).values({
    email,
    password: hashedPassword,
    name,
  });

  const userId = result[0].insertId;

  return {
    id: userId,
    email,
    name,
  };
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const db = await getDatabase();

  const userResult = await db.select().from(users).where(eq(users.email, email));
  
  if (userResult.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = userResult[0];
  const passwordMatch = await verifyPassword(password, user.password);

  if (!passwordMatch) {
    throw new Error('Invalid email or password');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function getUserById(id: number): Promise<AuthUser | null> {
  const db = await getDatabase();

  const userResult = await db.select().from(users).where(eq(users.id, id));
  
  if (userResult.length === 0) {
    return null;
  }

  const user = userResult[0];
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
