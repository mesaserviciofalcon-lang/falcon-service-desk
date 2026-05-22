-- CreateTable
CREATE TABLE "SolicitudAntecedente" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "fincaEAI" TEXT,
    "observaciones" TEXT,
    "prioridad" TEXT,

    CONSTRAINT "SolicitudAntecedente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SolicitudAntecedente_solicitudId_key" ON "SolicitudAntecedente"("solicitudId");

-- AddForeignKey
ALTER TABLE "SolicitudAntecedente" ADD CONSTRAINT "SolicitudAntecedente_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
