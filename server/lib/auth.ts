import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { Request } from 'express';

export interface AuthUser {
  id: string;
  username: string;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export async function createUser(username: string, password: string): Promise<AuthUser> {
  const hashedPassword = await hashPassword(password);
  
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
    },
    select: {
      id: true,
      username: true,
    },
  });
  
  return user;
}

export async function authenticateUser(username: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      password: true,
    },
  });
  
  if (!user) {
    return null;
  }
  
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }
  
  return {
    id: user.id,
    username: user.username,
  };
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
    },
  });
  
  return user;
}

export function getCurrentUser(req: Request): AuthUser | null {
  return (req.session as any)?.user || null;
}

export function requireAuth(req: Request): AuthUser {
  const user = getCurrentUser(req);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}