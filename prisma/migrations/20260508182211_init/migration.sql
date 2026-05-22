-- CreateTable
CREATE TABLE "Solicitud" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "solicitante" TEXT NOT NULL,
    "fincaEAI" TEXT,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "tecnicoAsignado" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);
