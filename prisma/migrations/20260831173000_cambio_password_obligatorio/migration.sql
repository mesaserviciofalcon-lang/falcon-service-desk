ALTER TABLE "Usuario"
ADD COLUMN "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE "Usuario"
SET "debeCambiarPassword" = TRUE
WHERE "createdAt" >= TIMESTAMPTZ '2026-08-31 00:00:00-05:00';
