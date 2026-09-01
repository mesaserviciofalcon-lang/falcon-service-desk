ALTER TABLE "SolicitudAccion"
  ADD COLUMN "norma" TEXT,
  ADD COLUMN "requisito" TEXT,
  ADD COLUMN "correcciones" JSONB,
  ADD COLUMN "analisisRealizadoCargo" TEXT;
