-- Sync missing Barbershop columns for production (Railway)
ALTER TABLE "Barbershop" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Barbershop" ADD COLUMN IF NOT EXISTS "address" TEXT;

-- Por si también faltan (muy común cuando el seed usa estos campos):
ALTER TABLE "Barbershop" ADD COLUMN IF NOT EXISTS "openTime" TEXT NOT NULL DEFAULT '09:00';
ALTER TABLE "Barbershop" ADD COLUMN IF NOT EXISTS "closeTime" TEXT NOT NULL DEFAULT '18:00';
ALTER TABLE "Barbershop" ADD COLUMN IF NOT EXISTS "slotMinutes" INTEGER NOT NULL DEFAULT 30;