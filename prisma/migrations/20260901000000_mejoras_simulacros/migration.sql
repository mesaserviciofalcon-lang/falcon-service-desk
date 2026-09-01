ALTER TABLE "SimulacroActividad"
  ADD COLUMN "duracionMinutos" INTEGER,
  ADD COLUMN "consecutivo" TEXT,
  ADD COLUMN "pasos" JSONB,
  ADD COLUMN "promedioEvaluacion" DOUBLE PRECISION,
  ADD COLUMN "sacSugerida" TEXT;

CREATE UNIQUE INDEX "SimulacroActividad_consecutivo_key" ON "SimulacroActividad"("consecutivo");

ALTER TABLE "SolicitudAccion"
  ADD COLUMN "fechaReprogramacion" TIMESTAMP(3),
  ADD COLUMN "actividadReprogramadaId" INTEGER;
