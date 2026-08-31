CREATE TABLE "EquipoAdministrativo" (
  "id" SERIAL NOT NULL,
  "nombres" TEXT NOT NULL,
  "apellidos" TEXT NOT NULL,
  "cargo" TEXT NOT NULL,
  "fotoUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EquipoAdministrativo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EquipoAdministrativo_nombres_apellidos_idx"
ON "EquipoAdministrativo"("nombres", "apellidos");
