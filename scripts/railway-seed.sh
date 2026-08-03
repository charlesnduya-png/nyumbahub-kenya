#!/usr/bin/env sh
# Optional: railway run ./scripts/railway-seed.sh
set -e
npx prisma migrate deploy
npx tsx prisma/seed.ts
echo "Seed complete."
