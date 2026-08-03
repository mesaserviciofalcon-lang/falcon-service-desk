CREATE TABLE "VulnerabilidadInforme" (
    "id" SERIAL NOT NULL,
    "eai" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actoInseguro" TEXT NOT NULL,
    "vulnerabilidad" TEXT NOT NULL,
    "planAccionSugerido" TEXT NOT NULL,
    "causaRaiz" TEXT,
    "proceso" TEXT,
    "planAccionEai" TEXT,
    "responsables" TEXT,
    "fechaEjecucion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "supervisor" TEXT NOT NULL,
    "correoSupervisor" TEXT,
    "reportadoPor" TEXT,
    "analistaSigNombre" TEXT,
    "analistaSigCorreo" TEXT,
    "gerenteNombre" TEXT,
    "gerenteCorreo" TEXT,
    "copiaCorreos" TEXT,
    "destinatarios" TEXT,
    "fotos" JSONB,
    "cierreObservaciones" TEXT,
    "cierreEvidencias" JSONB,
    "cerradoPor" TEXT,
    "cerradoPorCorreo" TEXT,
    "fechaCierre" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VulnerabilidadInforme_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VulnerabilidadInforme_eai_idx" ON "VulnerabilidadInforme"("eai");
CREATE INDEX "VulnerabilidadInforme_estado_idx" ON "VulnerabilidadInforme"("estado");
CREATE INDEX "VulnerabilidadInforme_fecha_idx" ON "VulnerabilidadInforme"("fecha");
