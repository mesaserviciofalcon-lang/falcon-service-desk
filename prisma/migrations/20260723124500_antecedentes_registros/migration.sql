-- CreateTable
CREATE TABLE "AntecedenteRegistro" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "fechaSolicitud" TEXT,
    "fechaRespuesta" TEXT,
    "eai" TEXT,
    "nombresApellidos" TEXT,
    "tipoDocumento" TEXT,
    "identificacion" TEXT NOT NULL,
    "fechaExpedicionDocumento" TEXT,
    "observacion" TEXT,
    "revisadoPor" TEXT,
    "motivo" TEXT,
    "autorizacion" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AntecedenteRegistro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AntecedenteRegistro_identificacion_idx" ON "AntecedenteRegistro"("identificacion");

-- CreateIndex
CREATE INDEX "AntecedenteRegistro_eai_idx" ON "AntecedenteRegistro"("eai");

-- CreateIndex
CREATE INDEX "AntecedenteRegistro_solicitudId_idx" ON "AntecedenteRegistro"("solicitudId");

-- AddForeignKey
ALTER TABLE "AntecedenteRegistro" ADD CONSTRAINT "AntecedenteRegistro_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
