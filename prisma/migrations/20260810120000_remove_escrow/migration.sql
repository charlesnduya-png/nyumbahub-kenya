-- Drop escrow feature
DROP TABLE IF EXISTS "EscrowDeposit";
DROP TYPE IF EXISTS "EscrowDepositStatus";
ALTER TABLE "Property" DROP COLUMN IF EXISTS "depositAmount";
