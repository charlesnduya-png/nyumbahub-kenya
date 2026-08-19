import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Sign in required" },
      { status: 401 },
    );
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { notifications, unreadCount },
    });
  } catch (error) {
    console.error("List notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load notifications" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Sign in required" },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      id?: string;
      markAll?: boolean;
    };

    if (body.markAll) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Notification id required" },
        { status: 400 },
      );
    }

    const existing = await prisma.notification.findFirst({
      where: { id: body.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 },
      );
    }

    const updated = await prisma.notification.update({
      where: { id: body.id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update notifications" },
      { status: 500 },
    );
  }
}
