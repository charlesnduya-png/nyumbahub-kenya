import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationCodeEmail, isMailConfigured } from "@/lib/mail";

const OTP_TTL_MS = 15 * 60 * 1000;
const OTP_PREFIX = "email-verify:";

function hashCode(email: string, code: string) {
  return createHash("sha256")
    .update(`${email.toLowerCase()}:${code}`)
    .digest("hex");
}

function otpIdentifier(email: string) {
  return `${OTP_PREFIX}${email.toLowerCase()}`;
}

export function generateOtpCode() {
  return String(randomInt(100000, 999999));
}

export async function createAndSendEmailOtp(input: {
  email: string;
  name?: string | null;
}) {
  const email = input.email.trim().toLowerCase();
  const code = generateOtpCode();
  const token = hashCode(email, code);
  const identifier = otpIdentifier(email);
  const expires = new Date(Date.now() + OTP_TTL_MS);

  await prisma.verificationToken.deleteMany({
    where: { identifier },
  });

  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  if (!isMailConfigured()) {
    // Dev fallback: keep code usable but warn in logs
    console.warn(
      `[email-otp] Mail not configured. Code for ${email}: ${code}`,
    );
    return {
      sent: false,
      previewCode: process.env.NODE_ENV === "production" ? undefined : code,
    };
  }

  await sendVerificationCodeEmail({
    to: email,
    name: input.name,
    code,
  });

  return { sent: true as const };
}

export async function verifyEmailOtp(input: {
  email: string;
  code: string;
}) {
  const email = input.email.trim().toLowerCase();
  const code = input.code.trim();
  if (!/^\d{6}$/.test(code)) {
    return { ok: false as const, error: "Enter the 6-digit code" };
  }

  const identifier = otpIdentifier(email);
  const token = hashCode(email, code);

  const record = await prisma.verificationToken.findFirst({
    where: { identifier, token },
  });

  if (!record) {
    return { ok: false as const, error: "Invalid or expired code" };
  }

  if (record.expires.getTime() < Date.now()) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    return { ok: false as const, error: "Code expired. Request a new one." };
  }

  await prisma.verificationToken.deleteMany({ where: { identifier } });

  const user = await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
    select: { id: true, email: true, name: true, role: true },
  });

  return { ok: true as const, user };
}
