ALTER TABLE "AntecedenteRegistro" ADD COLUMN "tusdatosBatchId" TEXT;
ALTER TABLE "AntecedenteRegistro" ADD COLUMN "tusdatosJobId" TEXT;
ALTER TABLE "AntecedenteRegistro" ADD COLUMN "tusdatosBatchNumber" INTEGER;
ALTER TABLE "AntecedenteRegistro" ADD COLUMN "tusdatosEstado" TEXT;
ALTER TABLE "AntecedenteRegistro" ADD COLUMN "tusdatosEnviadoAt" TIMESTAMP(3);

CREATE INDEX "AntecedenteRegistro_tusdatosBatchId_idx" ON "AntecedenteRegistro"("tusdatosBatchId");
