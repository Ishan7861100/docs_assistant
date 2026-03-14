import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { createUser, findUserByEmail, findUserById } from '../utils/dataStore';
import { User, AuthPayload } from '../types';

const SALT_ROUNDS = 10;

export async function registerUser(email: string, password: string, name: string): Promise<{ token: string; user: Omit<User, 'passwordHash'> }> {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error('Email already in use');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user: User = {
    id: uuidv4(),
    email,
    passwordHash,
    name,
    createdAt: new Date().toISOString(),
  };

  await createUser(user);

  const token = generateToken({ userId: user.id, email: user.email });
  const { passwordHash: _, ...safeUser } = user;
  return { token, user: safeUser };
}

export async function loginUser(email: string, password: string): Promise<{ token: string; user: Omit<User, 'passwordHash'> }> {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken({ userId: user.id, email: user.email });
  const { passwordHash: _, ...safeUser } = user;
  return { token, user: safeUser };
}

export async function getUserById(id: string): Promise<Omit<User, 'passwordHash'> | null> {
  const user = await findUserById(id);
  if (!user) return null;
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

function generateToken(payload: AuthPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}
