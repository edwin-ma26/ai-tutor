import bcrypt from 'bcryptjs';
import { Request } from 'express';
import fs from 'fs';
import path from 'path';

export interface AuthUser {
  id: string;
  username: string;
}

interface UserData {
  id: string;
  username: string;
  password: string;
}

const usersFile = path.join(process.cwd(), 'users.json');

function loadUsers(): UserData[] {
  try {
    if (fs.existsSync(usersFile)) {
      const data = fs.readFileSync(usersFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
  return [];
}

function saveUsers(users: UserData[]) {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export async function createUser(username: string, password: string): Promise<AuthUser> {
  const users = loadUsers();
  
  // Check if user already exists
  if (users.find(u => u.username === username)) {
    throw new Error('Username already exists');
  }
  
  const hashedPassword = await hashPassword(password);
  const newUser: UserData = {
    id: Date.now().toString(),
    username,
    password: hashedPassword,
  };
  
  users.push(newUser);
  saveUsers(users);
  
  return {
    id: newUser.id,
    username: newUser.username,
  };
}

export async function authenticateUser(username: string, password: string): Promise<AuthUser | null> {
  const users = loadUsers();
  const user = users.find(u => u.username === username);
  
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
  const users = loadUsers();
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return null;
  }
  
  return {
    id: user.id,
    username: user.username,
  };
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