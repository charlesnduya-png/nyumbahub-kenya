import type { Role } from "@/types";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  /** bcrypt hash for Password123! */
  passwordHash: string;
  image?: string | null;
}

export const DEMO_PASSWORD = "Password123!";

/** bcrypt hash of Password123! (cost 10) */
const DEMO_PASSWORD_HASH =
  "$2b$10$KerZIOQN07HPXkVJdE17iOeJPf9y0zuYnyUN3f/.779480cTG0MTS";

/**
 * Local demo accounts used when PostgreSQL is unavailable.
 * Password for every account: Password123!
 */
export const DEMO_USERS: DemoUser[] = [
  {
    id: "demo-admin-001",
    name: "NyumbaHub Admin",
    email: "admin@nyumbahub.co.ke",
    phone: "+254700000001",
    role: "ADMIN",
    passwordHash: DEMO_PASSWORD_HASH,
  },
  {
    id: "demo-seller-001",
    name: "Grace Wanjiku",
    email: "seller@nyumbahub.co.ke",
    phone: "+254712345678",
    role: "SELLER",
    passwordHash: DEMO_PASSWORD_HASH,
  },
  {
    id: "demo-agent-001",
    name: "David Ochieng",
    email: "agent@nyumbahub.co.ke",
    phone: "+254722334455",
    role: "AGENT",
    passwordHash: DEMO_PASSWORD_HASH,
  },
  {
    id: "demo-buyer-001",
    name: "Amina Hassan",
    email: "buyer@nyumbahub.co.ke",
    phone: "+254733445566",
    role: "BUYER",
    passwordHash: DEMO_PASSWORD_HASH,
  },
];

export function findDemoUser(email: string) {
  return DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
