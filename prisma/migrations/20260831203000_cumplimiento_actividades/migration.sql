ALTER TABLE "ActividadSupervisor"
ADD COLUMN "cumplidaEnFecha" BOOLEAN;

UPDATE "ActividadSupervisor"
SET "cumplidaEnFecha" = TRUE
WHERE "estado" = 'TERMINADO'
  AND "cumplidaEnFecha" IS NULL;

CREATE INDEX "ActividadSupervisor_fechaPlaneada_estado_idx"
ON "ActividadSupervisor"("fechaPlaneada", "estado");
