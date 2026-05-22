-- CreateTable
CREATE TABLE "GestionTicket" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "usuario" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "observacion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GestionTicket_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GestionTicket" ADD CONSTRAINT "GestionTicket_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
