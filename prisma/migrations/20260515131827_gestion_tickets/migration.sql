-- AlterTable
ALTER TABLE "Solicitud" ADD COLUMN     "fechaGestion" TIMESTAMP(3),
ADD COLUMN     "gestionadoPor" TEXT,
ADD COLUMN     "observacionesTecnico" TEXT;
