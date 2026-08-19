import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  listMessagesSchema,
  sendMessageSchema,
} from "@/lib/validations/message";
import { resolveProfessionalActingContext } from "@/lib/account-team";

function inboxPathForRole(role: string, peerId: string, propertyId?: string | null) {
  const params = new URLSearchParams({ peer: peerId });
  if (propertyId) params.set("property", propertyId);
  if (role === "BUYER") {
    return `/dashboard/tenant/messages?${params.toString()}`;
  }
  return `/dashboard/pro/inbox?${params.toString()}`;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Sign in required" },
      { status: 401 },
    );
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  const hostInboxAllowed =
    session.user.role === "ADMIN" ||
    ctx.permissions.manageMessages ||
    (ctx.isTeamMember && ctx.teamMemberRole === "READ");

  const userId = hostInboxAllowed ? ctx.actingOwnerId : session.user.id;
  const { searchParams } = new URL(request.url);
  const peerId = searchParams.get("peerId");

  if (peerId) {
    const parsed = listMessagesSchema.safeParse({
      peerId,
      propertyId: searchParams.get("propertyId") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid thread parameters" },
        { status: 400 },
      );
    }

    const { propertyId } = parsed.data;

    try {
      const messages = await prisma.message.findMany({
        where: {
          ...(propertyId
            ? { propertyId }
            : { propertyId: null }),
          OR: [
            { senderId: userId, receiverId: peerId },
            { senderId: peerId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: "asc" },
        take: 200,
        include: {
          sender: { select: { id: true, name: true, image: true } },
        },
      });

      await prisma.message.updateMany({
        where: {
          senderId: peerId,
          receiverId: userId,
          isRead: false,
          ...(propertyId ? { propertyId } : { propertyId: null }),
        },
        data: { isRead: true },
      });

      const peer = await prisma.user.findUnique({
        where: { id: peerId },
        select: { id: true, name: true, image: true, email: true, phone: true },
      });

      let property = null;
      if (propertyId) {
        property = await prisma.property.findUnique({
          where: { id: propertyId },
          select: { id: true, title: true, slug: true },
        });
      }

      return NextResponse.json({
        success: true,
        data: messages,
        peer,
        property,
      });
    } catch (error) {
      console.error("List thread messages error:", error);
      return NextResponse.json(
        { success: false, error: "Unable to load messages" },
        { status: 500 },
      );
    }
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
      },
    });

    const propertyIds = [
      ...new Set(messages.map((m) => m.propertyId).filter(Boolean)),
    ] as string[];

    const properties =
      propertyIds.length > 0
        ? await prisma.property.findMany({
            where: { id: { in: propertyIds } },
            select: { id: true, title: true, slug: true },
          })
        : [];

    const propertyMap = new Map(properties.map((p) => [p.id, p]));

    type ThreadKey = string;
    const threads = new Map<
      ThreadKey,
      {
        peerId: string;
        peerName: string;
        peerImage: string | null;
        propertyId: string | null;
        propertyTitle: string | null;
        propertySlug: string | null;
        lastMessage: string;
        lastMessageAt: Date;
        unreadCount: number;
      }
    >();

    for (const msg of messages) {
      const isIncoming = msg.receiverId === userId;
      const peer = isIncoming ? msg.sender : msg.receiver;
      const key = `${peer.id}:${msg.propertyId ?? ""}`;

      if (threads.has(key)) continue;

      const prop = msg.propertyId ? propertyMap.get(msg.propertyId) : null;
      const unreadInThread = messages.filter(
        (m) =>
          m.receiverId === userId &&
          m.senderId === peer.id &&
          m.propertyId === msg.propertyId &&
          !m.isRead,
      ).length;

      threads.set(key, {
        peerId: peer.id,
        peerName: peer.name ?? "User",
        peerImage: peer.image,
        propertyId: msg.propertyId,
        propertyTitle: prop?.title ?? null,
        propertySlug: prop?.slug ?? null,
        lastMessage: msg.content,
        lastMessageAt: msg.createdAt,
        unreadCount: unreadInThread,
      });
    }

    const conversations = [...threads.values()].sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime(),
    );

    const totalUnread = await prisma.message.count({
      where: { receiverId: userId, isRead: false },
    });

    return NextResponse.json({
      success: true,
      data: conversations,
      unreadCount: totalUnread,
    });
  } catch (error) {
    console.error("List conversations error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load inbox" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Sign in to send messages" },
      { status: 401 },
    );
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  const hostInboxAllowed = ctx.permissions.manageMessages || session.user.role === "ADMIN";

  try {
    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 },
      );
    }

    const { receiverId, content, propertyId } = parsed.data;

    // If this user is acting for a team owner, they must have message permissions to send as the owner.
    if (ctx.actingOwnerId !== session.user.id && !hostInboxAllowed) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const senderId = ctx.actingOwnerId === session.user.id ? session.user.id : ctx.actingOwnerId;

    if (receiverId === senderId) {
      return NextResponse.json(
        { success: false, error: "You cannot message yourself" },
        { status: 400 },
      );
    }

    const { assertTenantContactAccess } = await import("@/lib/tenant-access");
    const access = await assertTenantContactAccess({
      userId: senderId,
      role: ctx.actingOwnerRole ?? session.user.role,
    });
    if (!access.ok) {
      return NextResponse.json(
        {
          success: false,
          error: access.error,
          code: access.code,
          productId: access.productId,
          price: access.price,
          hours: access.hours,
        },
        { status: 402 },
      );
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, isActive: true, role: true },
    });

    if (!receiver?.isActive) {
      return NextResponse.json(
        { success: false, error: "Recipient not found" },
        { status: 404 },
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        propertyId: propertyId ?? null,
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });

    let propertyTitle: string | null = null;
    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { title: true },
      });
      propertyTitle = property?.title ?? null;
    }

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "MESSAGE",
        title: "New message",
        body: `${session.user.name ?? "Someone"} sent you a message${propertyTitle ? ` about ${propertyTitle}` : ""}.`,
        link: inboxPathForRole(receiver.role, senderId, propertyId),
      },
    });

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to send message" },
      { status: 500 },
    );
  }
}
