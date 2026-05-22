/*
  Warnings:

  - You are about to drop the column `camaraAfectada` on the `Solicitud` table. All the data in the column will be lost.
  - You are about to drop the column `cedula` on the `Solicitud` table. All the data in the column will be lost.
  - You are about to drop the column `descripcion` on the `Solicitud` table. All the data in the column will be lost.
  - You are about to drop the column `fincaEAI` on the `Solicitud` table. All the data in the column will be lost.
  - You are about to drop the column `nombreCandidato` on the `Solicitud` table. All the data in the column will be lost.
  - You are about to drop the column `radio` on the `Solicitud` table. All the data in the column will be lost.
  - You are about to drop the column `tecnicoAsignado` on the `Solicitud` table. All the data in the column will be lost.
  - You are about to drop the column `tipoFalla` on the `Solicitud` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Solicitud" DROP COLUMN "camaraAfectada",
DROP COLUMN "cedula",
DROP COLUMN "descripcion",
DROP COLUMN "fincaEAI",
DROP COLUMN "nombreCandidato",
DROP COLUMN "radio",
DROP COLUMN "tecnicoAsignado",
DROP COLUMN "tipoFalla",
ADD COLUMN     "asignadoA" TEXT,
ADD COLUMN     "correoSolicitante" TEXT,
ADD COLUMN     "fechaCierre" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SolicitudCCTV" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "fincaEAI" TEXT,
    "camaraAfectada" TEXT,
    "descripcionFalla" TEXT,
    "prioridad" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "SolicitudCCTV_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudVisita" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "nombreCandidato" TEXT,
    "cedula" TEXT,
    "fechaExpedicion" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "municipio" TEXT,
    "zona" TEXT,
    "cargo" TEXT,
    "fincaEAI" TEXT,
    "motivoVisita" TEXT,
    "fechaRealizada" TIMESTAMP(3),
    "observaciones" TEXT,
    "resultadoVisita" TEXT,

    CONSTRAINT "SolicitudVisita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudRadio" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "radio" TEXT,
    "serial" TEXT,
    "tipoFalla" TEXT,
    "fincaEAI" TEXT,
    "descripcion" TEXT,
    "prioridad" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "SolicitudRadio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SolicitudCCTV_solicitudId_key" ON "SolicitudCCTV"("solicitudId");

-- CreateIndex
CREATE UNIQUE INDEX "SolicitudVisita_solicitudId_key" ON "SolicitudVisita"("solicitudId");

-- CreateIndex
CREATE UNIQUE INDEX "SolicitudRadio_solicitudId_key" ON "SolicitudRadio"("solicitudId");

-- AddForeignKey
ALTER TABLE "SolicitudCCTV" ADD CONSTRAINT "SolicitudCCTV_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudVisita" ADD CONSTRAINT "SolicitudVisita_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudRadio" ADD CONSTRAINT "SolicitudRadio_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
