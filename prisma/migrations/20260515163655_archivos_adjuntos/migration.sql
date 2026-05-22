-- CreateTable
CREATE TABLE "ArchivoAdjunto" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "ruta" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivoAdjunto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ArchivoAdjunto" ADD CONSTRAINT "ArchivoAdjunto_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
