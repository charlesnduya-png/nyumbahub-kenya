-- Let professionals save how they want to get paid

CREATE TYPE "WalletPayoutMethod" AS ENUM ('MOBILE_MONEY', 'BANK');

ALTER TABLE "ProfessionalWallet"
  ADD COLUMN IF NOT EXISTS "payoutMethod" "WalletPayoutMethod",
  ADD COLUMN IF NOT EXISTS "payoutAccountName" TEXT,
  ADD COLUMN IF NOT EXISTS "payoutPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "payoutProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "payoutBankName" TEXT,
  ADD COLUMN IF NOT EXISTS "payoutBankAccount" TEXT,
  ADD COLUMN IF NOT EXISTS "payoutBankBranch" TEXT;
