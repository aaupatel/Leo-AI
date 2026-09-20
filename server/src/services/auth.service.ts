import {
  createUser,
  findUserById,
  findUserByEmail,
  updateUser,
} from '../repositories/users.repository';
import type { User } from '../repositories/types';

export async function createUserAuth(email: string, displayName: string): Promise<User> {
  return createUser(email, displayName);
}

export async function findUserByEmailAuth(email: string): Promise<User | null> {
  return findUserByEmail(email);
}

export async function findUserByIdAuth(id: string): Promise<User | null> {
  return findUserById(id);
}

export async function updateUserAuth(
  id: string,
  updates: Partial<Pick<User, 'email' | 'displayName'>>,
): Promise<User | null> {
  return updateUser(id, updates);
}
