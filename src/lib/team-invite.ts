import { createHash, randomBytes } from "crypto";
import type { TeamRole } from "@prisma/client";

import {
  TEAM_ROLE_LABEL,
  normalizeTeamRoles,
  type TeamRoleValue,
} from "@/lib/account-team";
import { isMailConfigured, sendTeamInviteEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function hashTeamInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function rolesLabel(roles: readonly TeamRole[]) {
  return roles.map((role) => TEAM_ROLE_LABEL[role as TeamRoleValue] ?? role).join(", ");
}

export async function createAndSendTeamInvite(input: {
  teamId: string;
  email: string;
  roles: readonly string[];
  ownerName: string;
}) {
  const email = input.email.trim().toLowerCase();
  const roles = normalizeTeamRoles(input.roles) as TeamRole[];
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashTeamInviteToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const existing = await prisma.accountTeamInvite.findFirst({
    where: { teamId: input.teamId, email, acceptedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const invite = existing
    ? await prisma.accountTeamInvite.update({
        where: { id: existing.id },
        data: { roles, tokenHash, expiresAt },
      })
    : await prisma.accountTeamInvite.create({
        data: {
          teamId: input.teamId,
          email,
          roles,
          tokenHash,
          expiresAt,
        },
      });

  const joinUrl = absoluteUrl(`/team/join?token=${encodeURIComponent(rawToken)}`);

  let emailSent = false;
  if (isMailConfigured()) {
    await sendTeamInviteEmail({
      to: email,
      ownerName: input.ownerName,
      rolesLabel: rolesLabel(roles),
      joinUrl,
    });
    emailSent = true;
  } else {
    console.warn(`[team-invite] Mail not configured. Join link for ${email}: ${joinUrl}`);
  }

  return { invite, joinUrl, emailSent };
}

export async function findPendingInviteByToken(rawToken: string) {
  const token = rawToken.trim();
  if (!token) return null;

  const invite = await prisma.accountTeamInvite.findUnique({
    where: { tokenHash: hashTeamInviteToken(token) },
    include: {
      team: {
        include: {
          owner: { select: { id: true, name: true, email: true, role: true } },
        },
      },
    },
  });

  if (!invite || invite.acceptedAt) return null;
  if (invite.expiresAt.getTime() < Date.now()) return null;
  return invite;
}
