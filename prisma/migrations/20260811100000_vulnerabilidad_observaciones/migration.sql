-- CreateTable
CREATE TABLE "VulnerabilidadObservacion" (
    "id" SERIAL NOT NULL,
    "informeId" INTEGER NOT NULL,
    "observacion" TEXT NOT NULL,
    "supervisor" TEXT NOT NULL,
    "usuarioNombre" TEXT,
    "usuarioCorreo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VulnerabilidadObservacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VulnerabilidadObservacion_informeId_idx" ON "VulnerabilidadObservacion"("informeId");

-- CreateIndex
CREATE INDEX "VulnerabilidadObservacion_createdAt_idx" ON "VulnerabilidadObservacion"("createdAt");

-- AddForeignKey
ALTER TABLE "VulnerabilidadObservacion" ADD CONSTRAINT "VulnerabilidadObservacion_informeId_fkey" FOREIGN KEY ("informeId") REFERENCES "VulnerabilidadInforme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
