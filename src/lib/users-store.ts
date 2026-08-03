/**
 * In-memory user directory for demo mode (Postgres offline).
 * Seeds with DEMO_USERS; registrations append here when DB fails.
 */

import bcrypt from "bcryptjs";

import { DEMO_USERS, type DemoUser } from "@/lib/demo-users";
import type { Role } from "@/types";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  passwordHash: string;
  image?: string | null;
  isActive: boolean;
  createdAt: string;
}

const globalForUsers = globalThis as unknown as {
  nyumbaDemoUsers?: StoredUser[];
};

function seedUsers(): StoredUser[] {
  return DEMO_USERS.map((u: DemoUser) => ({
    id: u.id,
    name: u.name,
    email: u.email.toLowerCase(),
    phone: u.phone,
    role: u.role,
    passwordHash: u.passwordHash,
    image: u.image ?? null,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  }));
}

if (!globalForUsers.nyumbaDemoUsers) {
  globalForUsers.nyumbaDemoUsers = seedUsers();
}

export const userStore = globalForUsers.nyumbaDemoUsers;

export function listDemoUsers() {
  return [...userStore].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function findStoredUser(email: string) {
  return (
    userStore.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null
  );
}

export function findStoredUserById(id: string) {
  return userStore.find((u) => u.id === id) ?? null;
}

export function createDemoUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}): StoredUser | { error: "EXISTS" } {
  const email = input.email.toLowerCase();
  const exists = userStore.some(
    (u) => u.email === email || u.phone === input.phone,
  );
  if (exists) return { error: "EXISTS" };

  const user: StoredUser = {
    id: `demo-user-${Date.now().toString(36)}`,
    name: input.name,
    email,
    phone: input.phone,
    role: input.role,
    passwordHash: bcrypt.hashSync(input.password, 10),
    image: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  userStore.unshift(user);
  return user;
}

export function setDemoUserActive(id: string, isActive: boolean) {
  const user = findStoredUserById(id);
  if (!user) return null;
  user.isActive = isActive;
  return user;
}

export function setDemoUserRole(id: string, role: Role) {
  const user = findStoredUserById(id);
  if (!user) return null;
  user.role = role;
  return user;
}
