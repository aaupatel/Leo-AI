import {
  createUser,
  findUserById,
  findUserByEmail,
  updateUser,
} from '../repositories/users.repository';
import type { User } from '../repositories/types';

export async function createUserService(email: string, displayName: string): Promise<User> {
  return createUser(email, displayName);
}

export async function getUserById(id: string): Promise<User | null> {
  return findUserById(id);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return findUserByEmail(email);
}

export async function updateUserService(
  id: string,
  updates: Partial<Pick<User, 'email' | 'displayName'>>,
): Promise<User | null> {
  return updateUser(id, updates);
}
