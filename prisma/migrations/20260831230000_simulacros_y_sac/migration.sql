CREATE TABLE "SimulacroActividad" (
  "id" SERIAL NOT NULL,
  "actividadId" INTEGER NOT NULL,
  "tipo" TEXT NOT NULL,
  "finca" TEXT NOT NULL,
  "area" TEXT,
  "horaInicio" TEXT NOT NULL,
  "guion" TEXT NOT NULL,
  "resultado" TEXT NOT NULL,
  "cumplimientoObjetivo" TEXT NOT NULL,
  "desarrollo" TEXT NOT NULL,
  "aspectos" JSONB NOT NULL,
  "conclusion" TEXT NOT NULL,
  "controlVulnerado" TEXT,
  "razonIncumplimiento" TEXT,
  "factoresFalla" JSONB,
  "requiereSac" BOOLEAN NOT NULL DEFAULT false,
  "evidencias" JSONB,
  "creadoPor" TEXT NOT NULL,
  "creadoPorCorreo" TEXT NOT NULL,
  "notificadoAt" TIMESTAMP(3),
  "recordatorioSacEnviadoAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SimulacroActividad_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SolicitudAccion" (
  "id" SERIAL NOT NULL,
  "simulacroId" INTEGER NOT NULL,
  "consecutivo" TEXT,
  "estado" TEXT NOT NULL DEFAULT 'ABIERTA',
  "tipoAccion" TEXT NOT NULL DEFAULT 'Correctiva',
  "proceso" TEXT NOT NULL DEFAULT 'Seguridad',
  "sistemaGestion" TEXT NOT NULL DEFAULT 'Seguridad Física',
  "responsableProceso" TEXT,
  "descripcionSituacion" TEXT NOT NULL,
  "correccion" TEXT,
  "analisisCausa" TEXT NOT NULL,
  "factoresCausa" JSONB NOT NULL,
  "planAccion" JSONB NOT NULL,
  "seguimiento" JSONB,
  "eficacia" BOOLEAN,
  "seCierra" BOOLEAN,
  "comentariosCierre" TEXT,
  "analistaNombre" TEXT NOT NULL,
  "analistaCorreo" TEXT NOT NULL,
  "fechaCierre" TIMESTAMP(3),
  "recordatorioEnviadoAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SolicitudAccion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SimulacroActividad_actividadId_key" ON "SimulacroActividad"("actividadId");
CREATE INDEX "SimulacroActividad_finca_idx" ON "SimulacroActividad"("finca");
CREATE INDEX "SimulacroActividad_resultado_idx" ON "SimulacroActividad"("resultado");
CREATE UNIQUE INDEX "SolicitudAccion_simulacroId_key" ON "SolicitudAccion"("simulacroId");
CREATE UNIQUE INDEX "SolicitudAccion_consecutivo_key" ON "SolicitudAccion"("consecutivo");
CREATE INDEX "SolicitudAccion_estado_idx" ON "SolicitudAccion"("estado");
CREATE INDEX "SolicitudAccion_analistaCorreo_idx" ON "SolicitudAccion"("analistaCorreo");
ALTER TABLE "SimulacroActividad" ADD CONSTRAINT "SimulacroActividad_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "ActividadSupervisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SolicitudAccion" ADD CONSTRAINT "SolicitudAccion_simulacroId_fkey" FOREIGN KEY ("simulacroId") REFERENCES "SimulacroActividad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
