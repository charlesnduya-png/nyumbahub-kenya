import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { optionalProfileUrl } from "@/lib/agent-social-url";
import { prisma } from "@/lib/prisma";
import { isOversizedProfileImage } from "@/lib/session-image";

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  bio: z.string().trim().max(2000).optional().nullable(),
  image: z.string().min(1).max(8_000_000).optional().nullable(),
  agencyName: z.string().trim().max(200).optional().nullable(),
  licenseNumber: z.string().trim().max(80).optional().nullable(),
  specialty: z.string().trim().max(120).optional().nullable(),
  website: optionalProfileUrl.optional(),
  facebookUrl: optionalProfileUrl.optional(),
  instagramUrl: optionalProfileUrl.optional(),
  linkedinUrl: optionalProfileUrl.optional(),
  twitterUrl: optionalProfileUrl.optional(),
  tiktokUrl: optionalProfileUrl.optional(),
  county: z.string().trim().max(80).optional().nullable(),
  town: z.string().trim().max(80).optional().nullable(),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        bio: true,
        role: true,
        verificationStatus: true,
        agentProfile: {
          select: {
            id: true,
            agencyName: true,
            licenseNumber: true,
            specialty: true,
            website: true,
            facebookUrl: true,
            instagramUrl: true,
            linkedinUrl: true,
            twitterUrl: true,
            tiktokUrl: true,
            county: true,
            town: true,
            isVerified: true,
            verificationStatus: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? "Invalid profile data",
        },
        { status: 400 },
      );
    }

    const {
      name,
      bio,
      image: rawImage,
      agencyName,
      licenseNumber,
      specialty,
      website,
      facebookUrl,
      instagramUrl,
      linkedinUrl,
      twitterUrl,
      tiktokUrl,
      county,
      town,
    } = parsed.data;

    if (rawImage !== undefined && isOversizedProfileImage(rawImage)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Profile photo is too large. Use a smaller image or configure Cloudinary for hosting.",
        },
        { status: 400 },
      );
    }

    const image = rawImage;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { agentProfile: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const isAgent = user.role === "AGENT";
    const agentFieldsProvided =
      agencyName !== undefined ||
      licenseNumber !== undefined ||
      specialty !== undefined ||
      website !== undefined ||
      facebookUrl !== undefined ||
      instagramUrl !== undefined ||
      linkedinUrl !== undefined ||
      twitterUrl !== undefined ||
      tiktokUrl !== undefined ||
      county !== undefined ||
      town !== undefined;

    if (agentFieldsProvided && !isAgent) {
      return NextResponse.json(
        {
          success: false,
          error: "Agency details are only available for agent accounts",
        },
        { status: 400 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextUser = await tx.user.update({
        where: { id: user.id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(bio !== undefined ? { bio } : {}),
          ...(image !== undefined ? { image } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          bio: true,
          role: true,
          verificationStatus: true,
        },
      });

      const agentSelect = {
        id: true,
        agencyName: true,
        licenseNumber: true,
        specialty: true,
        website: true,
        facebookUrl: true,
        instagramUrl: true,
        linkedinUrl: true,
        twitterUrl: true,
        tiktokUrl: true,
        county: true,
        town: true,
        isVerified: true,
        verificationStatus: true,
      } as const;

      let agentProfile = user.agentProfile
        ? {
            id: user.agentProfile.id,
            agencyName: user.agentProfile.agencyName,
            licenseNumber: user.agentProfile.licenseNumber,
            specialty: user.agentProfile.specialty,
            website: user.agentProfile.website,
            facebookUrl: user.agentProfile.facebookUrl,
            instagramUrl: user.agentProfile.instagramUrl,
            linkedinUrl: user.agentProfile.linkedinUrl,
            twitterUrl: user.agentProfile.twitterUrl,
            tiktokUrl: user.agentProfile.tiktokUrl,
            county: user.agentProfile.county,
            town: user.agentProfile.town,
            isVerified: user.agentProfile.isVerified,
            verificationStatus: user.agentProfile.verificationStatus,
          }
        : null;

      if (isAgent && agentFieldsProvided) {
        const agentData = {
          ...(agencyName !== undefined ? { agencyName } : {}),
          ...(licenseNumber !== undefined ? { licenseNumber } : {}),
          ...(specialty !== undefined ? { specialty } : {}),
          ...(website !== undefined ? { website } : {}),
          ...(facebookUrl !== undefined ? { facebookUrl } : {}),
          ...(instagramUrl !== undefined ? { instagramUrl } : {}),
          ...(linkedinUrl !== undefined ? { linkedinUrl } : {}),
          ...(twitterUrl !== undefined ? { twitterUrl } : {}),
          ...(tiktokUrl !== undefined ? { tiktokUrl } : {}),
          ...(county !== undefined ? { county } : {}),
          ...(town !== undefined ? { town } : {}),
        };

        if (user.agentProfile) {
          agentProfile = await tx.agent.update({
            where: { id: user.agentProfile.id },
            data: agentData,
            select: agentSelect,
          });
        } else {
          agentProfile = await tx.agent.create({
            data: {
              userId: user.id,
              ...agentData,
            },
            select: agentSelect,
          });
        }
      }

      return { ...nextUser, agentProfile };
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to update profile" },
      { status: 500 },
    );
  }
}
