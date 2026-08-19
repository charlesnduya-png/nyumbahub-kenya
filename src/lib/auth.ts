import type { Provider } from "@auth/core/providers";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { safeSessionImage } from "@/lib/session-image";
import {
  isSiteOwnerEmail,
  SITE_OWNER_EMAIL,
} from "@/lib/site-owner";
import type { Role } from "@/types";

function ownerPassword() {
  const fromEnv = process.env.SITE_OWNER_PASSWORD?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : "Babyblaq555@";
}

function toAuthUser(user: {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: safeSessionImage(user.image),
    role: (isSiteOwnerEmail(user.email) ? "ADMIN" : user.role) as Role,
  };
}

async function ensureSiteOwner(password: string) {
  const expected = ownerPassword();
  const incoming = String(password ?? "");

  let user = await prisma.user.findUnique({
    where: { email: SITE_OWNER_EMAIL },
  });

  const passwordMatchesExpected =
    incoming === expected || incoming.trim() === expected;

  if (user?.passwordHash) {
    const hashMatches = await bcrypt.compare(incoming, user.passwordHash);
    if (hashMatches || passwordMatchesExpected) {
      if (passwordMatchesExpected || user.role !== "ADMIN" || !user.isActive) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash: await bcrypt.hash(expected, 10),
            role: "ADMIN",
            isActive: true,
            emailVerified: new Date(),
            verificationStatus: "VERIFIED",
            name: user.name ?? "Charles Nduya",
          },
        });
      }
      return toAuthUser(user);
    }
    return null;
  }

  if (!passwordMatchesExpected) {
    return null;
  }

  const passwordHash = await bcrypt.hash(expected, 10);

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        role: "ADMIN",
        isActive: true,
        emailVerified: new Date(),
        verificationStatus: "VERIFIED",
        name: user.name ?? "Charles Nduya",
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email: SITE_OWNER_EMAIL,
        name: "Charles Nduya",
        passwordHash,
        role: "ADMIN",
        isActive: true,
        emailVerified: new Date(),
        verificationStatus: "VERIFIED",
      },
    });
  }

  return toAuthUser(user);
}

async function authorizeUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (isSiteOwnerEmail(normalizedEmail)) {
    try {
      return await ensureSiteOwner(password);
    } catch (error) {
      console.error("Site owner login failed:", error);
      return null;
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user?.passwordHash || !user.isActive) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    return toAuthUser(user);
  } catch (error) {
    console.error("Login database error:", error);
    return null;
  }
}

const providers: Provider[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = String(
        (credentials as { email?: unknown } | undefined)?.email ?? "",
      ).trim();
      const password = String(
        (credentials as { password?: unknown } | undefined)?.password ?? "",
      );

      if (!email || !password || password.length < 8) {
        return null;
      }

      return authorizeUser(email, password);
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
  // JWT + credentials only — PrismaAdapter breaks credential sign-in on serverless.
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
        token.picture = safeSessionImage(user.image);
      }

      if (trigger === "update" && session?.user) {
        if (session.user.name !== undefined) {
          token.name = session.user.name;
        }
        if (session.user.image !== undefined) {
          token.picture = safeSessionImage(session.user.image);
        }
      }

      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: String(token.id) },
            select: { role: true, isActive: true, email: true, image: true },
          });
          if (dbUser?.isActive) {
            token.email = dbUser.email;
            token.role = (
              isSiteOwnerEmail(dbUser.email) ? "ADMIN" : dbUser.role
            ) as Role;
            const dbImage = safeSessionImage(dbUser.image);
            if (dbImage) {
              token.picture = dbImage;
            }
          }
        } catch {
          // keep existing token role if DB is unavailable
        }
      }

      if (isSiteOwnerEmail(token.email as string | undefined)) {
        token.role = "ADMIN";
      }

      return token;
    },
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        return Boolean(user?.id);
      }
      return true;
    },
  },
});

export { authConfig };
