CREATE TABLE "VisitaHistorica" (
    "id" SERIAL NOT NULL,
    "fechaSolicitud" TEXT,
    "fechaSolicitudDate" TIMESTAMP(3),
    "nombresApellidos" TEXT,
    "cedula" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "municipio" TEXT,
    "zona" TEXT,
    "motivoVisita" TEXT,
    "cargo" TEXT,
    "fincaEAI" TEXT,
    "fechaExpedicionCedula" TEXT,
    "fechaVisitaRealizada" TEXT,
    "fechaVisitaDate" TIMESTAMP(3),
    "origenArchivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitaHistorica_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VisitaHistorica_cedula_idx" ON "VisitaHistorica"("cedula");

CREATE INDEX "VisitaHistorica_fincaEAI_idx" ON "VisitaHistorica"("fincaEAI");

CREATE INDEX "VisitaHistorica_fechaVisitaDate_idx" ON "VisitaHistorica"("fechaVisitaDate");
