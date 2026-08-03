ALTER TABLE "VulnerabilidadInforme"
ADD COLUMN "consecutivo" TEXT;

CREATE INDEX "VulnerabilidadInforme_consecutivo_idx"
ON "VulnerabilidadInforme"("consecutivo");
