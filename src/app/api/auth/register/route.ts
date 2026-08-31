import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { createAndSendEmailOtp } from "@/lib/email-otp";
import {
  attachHotelReferral,
  createJobPartnerProfile,
} from "@/lib/job-partner";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const {
      name,
      email,
      phone,
      password,
      role,
      nationalId,
      agencyName,
      licenseNumber,
      county,
      jobRef,
    } = parsed.data;
    const normalizedEmail = email.toLowerCase();
    const cleanedNationalId = nationalId?.trim().toUpperCase() || null;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phone },
          ...(cleanedNationalId ? [{ nationalId: cleanedNationalId }] : []),
        ],
      },
    });

    if (existing) {
      const conflict =
        cleanedNationalId && existing.nationalId === cleanedNationalId
          ? "An account with this National ID already exists"
          : "An account with this email or phone already exists";
      return NextResponse.json(
        { success: false, error: conflict },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const isProfessional = role === "SELLER" || role === "AGENT";
    const isJobPartner = role === "JOB_PARTNER";

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone,
        passwordHash,
        role,
        nationalId: cleanedNationalId,
        nationalIdVerified: cleanedNationalId ? "PENDING" : "UNVERIFIED",
        verificationStatus:
          isProfessional || isJobPartner ? "PENDING" : "UNVERIFIED",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        nationalId: true,
        createdAt: true,
      },
    });

    if (role === "AGENT") {
      await prisma.agent.create({
        data: {
          userId: user.id,
          agencyName: agencyName?.trim() || `${name}'s Agency`,
          licenseNumber: licenseNumber?.trim() || null,
          county: county?.trim() || "Nairobi",
          town: county?.trim() || "Nairobi",
          verificationStatus: "PENDING",
          isVerified: false,
        },
      });
    }

    if (isJobPartner) {
      await createJobPartnerProfile(user.id);
    }

    if (isProfessional && jobRef) {
      await attachHotelReferral({ hotelUserId: user.id, jobRef });
    }

    let otpSent = false;
    let previewCode: string | undefined;
    try {
      const otp = await createAndSendEmailOtp({
        email: user.email,
        name: user.name,
      });
      otpSent = otp.sent;
      if ("previewCode" in otp) previewCode = otp.previewCode;
    } catch (error) {
      console.error("Failed to send registration verification code:", error);
    }

    return NextResponse.json(
      {
        success: true,
        data: user,
        requiresEmailVerification: true,
        otpSent,
        previewCode,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Unable to create account. Please try again later.",
      },
      { status: 500 },
    );
  }
}
