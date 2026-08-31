CREATE TABLE "ActividadSupervisor" (
    "id" SERIAL NOT NULL,
    "origenId" TEXT,
    "fechaPlaneada" TIMESTAMP(3) NOT NULL,
    "fechaPlaneadaFin" TIMESTAMP(3),
    "finca" TEXT NOT NULL,
    "actividad" TEXT NOT NULL,
    "area" TEXT,
    "supervisorNombre" TEXT,
    "supervisorCorreo" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE_ASIGNAR',
    "observacionesCierre" TEXT,
    "evidencias" JSONB,
    "fechaCierre" TIMESTAMP(3),
    "cerradoPor" TEXT,
    "cerradoPorCorreo" TEXT,
    "creadoPor" TEXT,
    "creadoPorCorreo" TEXT,
    "recordatorioPrevioEnviadoAt" TIMESTAMP(3),
    "recordatorioIncumplimientoEnviadoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActividadSupervisor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ActividadSupervisor_origenId_key" ON "ActividadSupervisor"("origenId");
CREATE INDEX "ActividadSupervisor_fechaPlaneada_idx" ON "ActividadSupervisor"("fechaPlaneada");
CREATE INDEX "ActividadSupervisor_estado_idx" ON "ActividadSupervisor"("estado");
CREATE INDEX "ActividadSupervisor_supervisorCorreo_idx" ON "ActividadSupervisor"("supervisorCorreo");
