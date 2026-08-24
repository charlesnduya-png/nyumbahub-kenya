-- Africa-wide payout details: country, SWIFT, email, and digital wallets

ALTER TYPE "WalletPayoutMethod" ADD VALUE IF NOT EXISTS 'DIGITAL_WALLET';

ALTER TABLE "ProfessionalWallet"
  ADD COLUMN IF NOT EXISTS "payoutCountry" TEXT,
  ADD COLUMN IF NOT EXISTS "payoutSwift" TEXT,
  ADD COLUMN IF NOT EXISTS "payoutEmail" TEXT;
