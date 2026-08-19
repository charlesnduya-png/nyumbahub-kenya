import { createHash, randomBytes } from "crypto";
import { absoluteUrl } from "@/lib/seo";
import { isMailConfigured, sendPasswordResetEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

const RESET_TTL_MS = 60 * 60 * 1000;
const RESET_PREFIX = "password-reset:";

function hashToken(email: string, token: string) {
  return createHash("sha256")
    .update(`${email.toLowerCase()}:${token}`)
    .digest("hex");
}

function resetIdentifier(email: string) {
  return `${RESET_PREFIX}${email.toLowerCase()}`;
}

export async function createAndSendPasswordReset(input: {
  email: string;
  name?: string | null;
}) {
  const email = input.email.trim().toLowerCase();
  const rawToken = randomBytes(32).toString("hex");
  const token = hashToken(email, rawToken);
  const identifier = resetIdentifier(email);
  const expires = new Date(Date.now() + RESET_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  const resetUrl = absoluteUrl(
    `/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(rawToken)}`,
  );

  if (!isMailConfigured()) {
    console.warn(
      `[password-reset] Mail not configured. Reset link for ${email}: ${resetUrl}`,
    );
    return {
      sent: false as const,
      previewUrl: process.env.NODE_ENV === "production" ? undefined : resetUrl,
    };
  }

  await sendPasswordResetEmail({
    to: email,
    name: input.name,
    resetUrl,
  });

  return { sent: true as const };
}

export async function consumePasswordResetToken(input: {
  email: string;
  token: string;
}) {
  const email = input.email.trim().toLowerCase();
  const rawToken = input.token.trim();
  if (!email || !rawToken) {
    return { ok: false as const, error: "Invalid reset link" };
  }

  const identifier = resetIdentifier(email);
  const token = hashToken(email, rawToken);
  const record = await prisma.verificationToken.findFirst({
    where: { identifier, token },
  });

  if (!record) {
    return { ok: false as const, error: "Invalid or expired reset link" };
  }

  if (record.expires.getTime() < Date.now()) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    return {
      ok: false as const,
      error: "Reset link expired. Request a new one.",
    };
  }

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  return { ok: true as const, email };
}
