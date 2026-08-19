import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveProfessionalActingContext } from "@/lib/account-team";

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z
    .enum(["FULL", "LISTINGS", "INQUIRIES", "VIEWINGS", "OFFERS", "BOOKINGS", "MESSAGES", "READ"])
    .optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  if (!ctx.permissions.manageTeam) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const team = await prisma.accountTeam.findUnique({
      where: { ownerId: ctx.actingOwnerId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ownerId: ctx.actingOwnerId,
        members: team?.members.map((m) => ({
          userId: m.userId,
          role: m.role,
          user: {
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            image: m.user.image,
          },
        })) ?? [],
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to load team" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  if (!ctx.permissions.manageTeam) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = addMemberSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.email.toLowerCase() === session.user.email?.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "You cannot add yourself as a team member" },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, email: true, isActive: true, role: true },
    });

    if (!targetUser?.isActive) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const team = await prisma.accountTeam.upsert({
      where: { ownerId: ctx.actingOwnerId },
      create: { ownerId: ctx.actingOwnerId },
      update: {},
    });

    // Keep team-member UI consistent by aligning their base role with the acting owner role.
    // (Fine-grained permissions are enforced via AccountTeamMember.role.)
    if (ctx.actingOwnerRole === "SELLER" || ctx.actingOwnerRole === "AGENT") {
      if (targetUser.role !== ctx.actingOwnerRole) {
        await prisma.user.update({
          where: { id: targetUser.id },
          data: { role: ctx.actingOwnerRole },
        });
      }
    }

    // NOTE: userId is unique in AccountTeamMember, so this prevents the same user being in multiple teams.
    const member = await prisma.accountTeamMember.create({
      data: {
        teamId: team.id,
        userId: targetUser.id,
        role: parsed.data.role ?? "INQUIRIES",
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: member.userId,
        role: member.role,
        user: {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          image: member.user.image,
        },
      },
    });
  } catch (error) {
    // Unique constraint violations can bubble up here.
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to add team member (possibly already added to another team).",
      },
      { status: 400 },
    );
  }
}

