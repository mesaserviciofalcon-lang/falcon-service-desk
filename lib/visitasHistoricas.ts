import { prisma }
from "@/lib/prisma";

export function normalizarCedula(
  cedula?: string | null
) {
  return String(cedula || "")
    .replace(/\D/g, "")
    .trim();
}

export async function obtenerUltimaVisitaHistorica(
  cedula?: string | null
) {
  const cedulaNormalizada =
    normalizarCedula(cedula);

  if (!cedulaNormalizada) {
    return null;
  }

  return prisma.visitaHistorica.findFirst({
    where: {
      cedula:
        cedulaNormalizada,
    },
    select: {
      id: true,
      fechaVisitaRealizada: true,
      fechaVisitaDate: true,
      fincaEAI: true,
      motivoVisita: true,
    },
    orderBy: [
      {
        fechaVisitaDate: {
          sort: "desc",
          nulls: "last",
        },
      },
      {
        id: "desc",
      },
    ],
  });
}
