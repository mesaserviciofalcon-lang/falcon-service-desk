-- Seguimiento de la programación que realiza cada Analista SIG para el mes siguiente.
ALTER TABLE "ActividadSupervisor"
  ADD COLUMN "recordatorioProgramacionEnviadoAt" TIMESTAMP(3),
  ADD COLUMN "programadoPorAnalistaAt" TIMESTAMP(3);
