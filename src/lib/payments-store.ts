import { getProduct, type ProductId } from "@/lib/pricing";

export type PaymentRecordStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail?: string | null;
  amount: number;
  currency: "KES";
  method: "MPESA" | "CARD";
  status: PaymentRecordStatus;
  productId: ProductId | string;
  productName: string;
  phone?: string;
  propertyId?: string | null;
  reference: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  paidAt?: string | null;
}

const globalStore = globalThis as unknown as {
  nyumbaPayments?: PaymentRecord[];
};

if (!globalStore.nyumbaPayments) {
  globalStore.nyumbaPayments = [];
}

export const paymentStore = globalStore.nyumbaPayments;

export function createPayment(input: {
  userId: string;
  userEmail?: string | null;
  productId: string;
  amount?: number;
  phone?: string;
  propertyId?: string | null;
  method?: "MPESA" | "CARD";
  metadata?: Record<string, unknown>;
}): PaymentRecord {
  const product = getProduct(input.productId);
  const amount = input.amount ?? product?.price ?? 0;
  const now = new Date().toISOString();
  const record: PaymentRecord = {
    id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    userEmail: input.userEmail,
    amount,
    currency: "KES",
    method: input.method ?? "MPESA",
    status: "PENDING",
    productId: input.productId,
    productName: product?.name ?? input.productId,
    phone: input.phone,
    propertyId: input.propertyId,
    reference: `NH-${Date.now().toString().slice(-8)}`,
    description: product?.name ?? "Your Home payment",
    metadata: input.metadata,
    createdAt: now,
    updatedAt: now,
    paidAt: null,
  };

  paymentStore.unshift(record);
  return record;
}

export function getPayment(id: string) {
  return paymentStore.find((p) => p.id === id) ?? null;
}

export function completePayment(id: string) {
  const payment = getPayment(id);
  if (!payment) return null;
  payment.status = "COMPLETED";
  payment.paidAt = new Date().toISOString();
  payment.updatedAt = payment.paidAt;
  return payment;
}

export function failPayment(id: string) {
  const payment = getPayment(id);
  if (!payment) return null;
  payment.status = "FAILED";
  payment.updatedAt = new Date().toISOString();
  return payment;
}

export function listPaymentsForUser(userId: string) {
  return paymentStore.filter((p) => p.userId === userId);
}

export function listAllPayments() {
  return [...paymentStore];
}
