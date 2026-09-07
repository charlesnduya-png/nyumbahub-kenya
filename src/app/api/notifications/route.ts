import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { ttlCached, ttlDelete } from "@/lib/ttl-cache";

function notifCacheKey(userId: string) {
  return `notifications:${userId}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Sign in required" },
      { status: 401 },
    );
  }

  const userId = session.user.id;
  const limited = rateLimit({
    key: `notifications:get:${userId}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return tooManyRequests(limited.retryAfterSec);
  }

  try {
    const data = await ttlCached(notifCacheKey(userId), 25_000, async () => {
      const [notifications, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 40,
        }),
        prisma.notification.count({
          where: { userId, isRead: false },
        }),
      ]);
      return { notifications, unreadCount };
    });

    return NextResponse.json({
      success: true,
      data,
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

  const userId = session.user.id;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      id?: string;
      markAll?: boolean;
    };

    if (body.markAll) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      ttlDelete(notifCacheKey(userId));
      return NextResponse.json({ success: true });
    }

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Notification id required" },
        { status: 400 },
      );
    }

    const existing = await prisma.notification.findFirst({
      where: { id: body.id, userId },
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
    ttlDelete(notifCacheKey(userId));

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update notifications" },
      { status: 500 },
    );
  }
}
