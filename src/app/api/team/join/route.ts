import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findPendingInviteByToken, rolesLabel } from "@/lib/team-invite";

const kenyanPhoneRegex = /^(\+254|254|0)?[17]\d{8}$/;

const joinSchema = z
  .object({
    token: z.string().min(10),
    name: z.string().trim().min(2).max(100).optional(),
    phone: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.phone && !kenyanPhoneRegex.test(data.phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid Kenyan phone number (e.g. 0712345678)",
        path: ["phone"],
      });
    }
  });

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  const invite = await findPendingInviteByToken(token);

  if (!invite) {
    return NextResponse.json(
      { success: false, error: "This invitation is invalid or has expired." },
      { status: 404 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: invite.email },
    select: { id: true },
  });

  return NextResponse.json({
    success: true,
    data: {
      email: invite.email,
      ownerName: invite.team.owner.name || invite.team.owner.email,
      roles: invite.roles,
      rolesLabel: rolesLabel(invite.roles),
      expiresAt: invite.expiresAt,
      accountExists: Boolean(existing),
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const invite = await findPendingInviteByToken(parsed.data.token);
  if (!invite) {
    return NextResponse.json(
      { success: false, error: "This invitation is invalid or has expired." },
      { status: 404 },
    );
  }

  const session = await auth();
  const existing = await prisma.user.findUnique({
    where: { email: invite.email },
    select: { id: true, email: true, isActive: true, role: true },
  });

  try {
    if (existing) {
      if (!existing.isActive) {
        return NextResponse.json({ success: false, error: "Account is disabled." }, { status: 403 });
      }

      if (!session?.user?.id || session.user.email?.toLowerCase() !== invite.email) {
        return NextResponse.json(
          {
            success: false,
            needsSignIn: true,
            error: "Sign in with this email to join the team.",
          },
          { status: 401 },
        );
      }

      const alreadyMember = await prisma.accountTeamMember.findUnique({
        where: { userId: existing.id },
        select: { team: { select: { ownerId: true } } },
      });
      if (alreadyMember && alreadyMember.team.ownerId !== invite.team.ownerId) {
        return NextResponse.json(
          { success: false, error: "This account already belongs to another team." },
          { status: 400 },
        );
      }

      await acceptInvite({
        inviteId: invite.id,
        userId: existing.id,
        teamId: invite.teamId,
        roles: invite.roles,
        ownerRole: invite.team.owner.role,
      });

      return NextResponse.json({ success: true, data: { createdAccount: false } });
    }

    const name = parsed.data.name?.trim();
    const password = parsed.data.password ?? "";
    const confirmPassword = parsed.data.confirmPassword ?? "";

    if (!name || name.length < 2) {
      return NextResponse.json({ success: false, error: "Enter your name" }, { status: 400 });
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters and include upper, lower, and a number.",
        },
        { status: 400 },
      );
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: "Passwords do not match" }, { status: 400 });
    }

    if (parsed.data.phone) {
      const phoneTaken = await prisma.user.findUnique({
        where: { phone: parsed.data.phone },
        select: { id: true },
      });
      if (phoneTaken) {
        return NextResponse.json(
          { success: false, error: "That phone number is already in use" },
          { status: 409 },
        );
      }
    }

    const ownerRole =
      invite.team.owner.role === "AGENT" || invite.team.owner.role === "SELLER"
        ? invite.team.owner.role
        : "SELLER";
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: invite.email,
        phone: parsed.data.phone ?? null,
        passwordHash,
        role: ownerRole,
        emailVerified: new Date(),
        verificationStatus: "UNVERIFIED",
      },
    });

    await acceptInvite({
      inviteId: invite.id,
      userId: user.id,
      teamId: invite.teamId,
      roles: invite.roles,
      ownerRole,
    });

    return NextResponse.json({
      success: true,
      data: { createdAccount: true, email: invite.email },
    });
  } catch (error) {
    console.error("Accept team invite failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to join the team. Try again." },
      { status: 500 },
    );
  }
}

async function acceptInvite(input: {
  inviteId: string;
  userId: string;
  teamId: string;
  roles: Array<"FULL" | "LISTINGS" | "INQUIRIES" | "VIEWINGS" | "OFFERS" | "BOOKINGS" | "MESSAGES" | "READ">;
  ownerRole: string;
}) {
  await prisma.$transaction([
    prisma.accountTeamMember.upsert({
      where: { userId: input.userId },
      create: {
        teamId: input.teamId,
        userId: input.userId,
        roles: input.roles,
      },
      update: {
        teamId: input.teamId,
        roles: input.roles,
      },
    }),
    prisma.accountTeamInvite.update({
      where: { id: input.inviteId },
      data: { acceptedAt: new Date() },
    }),
    ...(input.ownerRole === "SELLER" || input.ownerRole === "AGENT"
      ? [
          prisma.user.update({
            where: { id: input.userId },
            data: { role: input.ownerRole },
          }),
        ]
      : []),
  ]);
}
