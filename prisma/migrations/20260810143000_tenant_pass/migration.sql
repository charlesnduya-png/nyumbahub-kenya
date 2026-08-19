-- Add tenant 24-hour viewing pass plan
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'TENANT_PASS';
