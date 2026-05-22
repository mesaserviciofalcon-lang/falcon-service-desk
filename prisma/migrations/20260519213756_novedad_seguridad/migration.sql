-- CreateTable
CREATE TABLE "SeguridadNovedad" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "fincaEAI" TEXT,
    "contexto" TEXT,

    CONSTRAINT "SeguridadNovedad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeguridadNovedad_solicitudId_key" ON "SeguridadNovedad"("solicitudId");

-- AddForeignKey
ALTER TABLE "SeguridadNovedad" ADD CONSTRAINT "SeguridadNovedad_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
