import { prisma } from "@/lib/prisma";
import { SITE_OWNER_EMAIL } from "@/lib/site-owner";
import type { NotificationType } from "@prisma/client";

export async function notifyAdmins(input: {
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}) {
  const admins = await prisma.user.findMany({
    where: {
      OR: [{ role: "ADMIN" }, { email: SITE_OWNER_EMAIL }],
      isActive: true,
    },
    select: { id: true },
  });

  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
    })),
  });
}
