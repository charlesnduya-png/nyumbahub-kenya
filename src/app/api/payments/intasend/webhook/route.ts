import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import {
  validateIntaSendWebhookChallenge,
  type IntaSendInvoice,
} from "@/lib/intasend";
import { fulfillCompletedPayment } from "@/lib/payment-fulfillment";
import { prisma } from "@/lib/prisma";

type WebhookPayload = IntaSendInvoice & {
  challenge?: string;
};

function jsonMeta(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Prisma.InputJsonObject {
  return { ...base, ...patch } as Prisma.InputJsonObject;
}

async function findPayment(payload: WebhookPayload) {
  const apiRef = payload.api_ref?.trim();
  const invoiceId = payload.invoice_id?.trim();

  if (!apiRef && !invoiceId) {
    return null;
  }

  return prisma.payment.findFirst({
    where: {
      OR: [
        ...(apiRef ? [{ id: apiRef }, { reference: apiRef }] : []),
        ...(invoiceId
          ? [
              {
                metadata: {
                  path: ["intasendInvoiceId"],
                  equals: invoiceId,
                },
              },
            ]
          : []),
      ],
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WebhookPayload;

    if (!validateIntaSendWebhookChallenge(body.challenge)) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook challenge" },
        { status: 401 },
      );
    }

    const payment = await findPayment(body);
    if (!payment) {
      return NextResponse.json({ success: true, message: "No matching payment" });
    }

    const existingMeta = (payment.metadata as Record<string, unknown>) ?? {};
    const state = String(body.state ?? "").toUpperCase();

    if (state === "COMPLETE") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          mpesaReceipt: body.mpesa_reference ?? payment.mpesaReceipt ?? undefined,
          metadata: jsonMeta(existingMeta, {
            intasendInvoiceId: body.invoice_id,
            intasendState: state,
            intasendProvider: body.provider ?? null,
            amountPaid:
              body.value != null
                ? String(body.value)
                : existingMeta.amountPaid != null
                  ? String(existingMeta.amountPaid)
                  : null,
            callbackAt: new Date().toISOString(),
          }),
        },
      });

      await fulfillCompletedPayment({
        id: payment.id,
        userId: payment.userId,
        metadata: {
          ...existingMeta,
          productId: existingMeta.productId as string | undefined,
        },
        amount: body.value ? Number(body.value) : payment.amount,
        mpesaReceipt: body.mpesa_reference,
      });
    } else if (state === "FAILED" || state === "CANCELED") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          metadata: jsonMeta(existingMeta, {
            intasendInvoiceId: body.invoice_id,
            intasendState: state,
            failedReason: body.failed_reason ?? null,
            callbackAt: new Date().toISOString(),
          }),
        },
      });
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          metadata: jsonMeta(existingMeta, {
            intasendInvoiceId: body.invoice_id,
            intasendState: state,
            callbackAt: new Date().toISOString(),
          }),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("IntaSend webhook error:", error);
    return NextResponse.json({ success: true, message: "Acknowledged" });
  }
}
