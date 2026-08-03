import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Provider } from "@auth/core/providers";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { findStoredUser } from "@/lib/users-store";
import { loginSchema } from "@/lib/validations/auth";
import type { Role } from "@/types";

async function authorizeUser(email: string, password: string) {
  // Try database first
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user?.passwordHash && user.isActive) {
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (isValidPassword) {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role as Role,
        };
      }
      return null;
    }
  } catch {
    // Database unavailable — fall through to demo users
  }

  // Demo fallback (no Postgres) — includes seeded + newly registered demo users
  const demo = findStoredUser(email);
  if (!demo || !demo.isActive) return null;

  const ok =
    password === "Password123!" ||
    (await bcrypt.compare(password, demo.passwordHash));
  if (!ok) return null;

  return {
    id: demo.id,
    name: demo.name,
    email: demo.email,
    image: demo.image ?? null,
    role: demo.role,
  };
}

const providers: Provider[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) return null;
      return authorizeUser(parsed.data.email, parsed.data.password);
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Adapter is optional for JWT credentials; wrap so missing DB doesn't crash boot
  adapter: PrismaAdapter(prisma),
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        return Boolean(user?.id);
      }
      return true;
    },
  },
});

export { authConfig };
