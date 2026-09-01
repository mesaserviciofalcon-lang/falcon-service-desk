import { prisma } from "@/lib/prisma";
import { normalizarCedula } from "@/lib/visitasHistoricas";

type ReferenciaVisita = { ticketId?: number; estado?: string; fecha: Date };
type VisitaVigente = ReferenciaVisita & { fechaVencimiento: Date; diasRestantes: number; puedeRenovar: boolean };
export type ResultadoValidacionVisita = { cedula: string; pendiente: { ticketId: number; estado: string; fecha: Date } | null; vigente: VisitaVigente | null };

function estadoNormalizado(estado?: string | null) {
  return String(estado || "").trim().toUpperCase();
}

function fechaVigente(fecha?: Date | null) {
  if (!fecha) return false;
  const limite = new Date();
  limite.setFullYear(limite.getFullYear() - 2);
  return fecha >= limite;
}

function datosVigencia(visita: ReferenciaVisita): VisitaVigente {
  const fechaVencimiento = new Date(visita.fecha);
  fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 2);
  const diasRestantes = Math.max(0, Math.ceil((fechaVencimiento.getTime() - Date.now()) / 86_400_000));
  return { ...visita, fechaVencimiento, diasRestantes, puedeRenovar: diasRestantes <= 30 };
}

export async function validarVisitaPorCedula(cedula?: string | null): Promise<ResultadoValidacionVisita> {
  const cedulaNormalizada = normalizarCedula(cedula);
  if (cedulaNormalizada.length < 5) return { cedula: cedulaNormalizada, pendiente: null, vigente: null };

  const [visitasActuales, visitasHistoricas] = await Promise.all([
    prisma.solicitudVisita.findMany({
      where: { cedula: cedulaNormalizada },
      select: { fechaRealizada: true, resultadoVisita: true, solicitud: { select: { id: true, estado: true, fechaCierre: true } } },
    }),
    prisma.visitaHistorica.findMany({
      where: { cedula: cedulaNormalizada, fechaVisitaDate: { not: null } },
      select: { fechaVisitaDate: true },
      orderBy: { fechaVisitaDate: "desc" },
    }),
  ]);

  const pendienteActual = visitasActuales
    .map((visita) => ({ ticketId: visita.solicitud.id, estado: estadoNormalizado(visita.solicitud.estado), fecha: visita.solicitud.fechaCierre || visita.fechaRealizada || new Date(0) }))
    .filter((visita) => ["PENDIENTE", "EN PROCESO"].includes(visita.estado))
    .sort((a, b) => b.ticketId - a.ticketId)[0] || null;

  const referenciasVigentes: ReferenciaVisita[] = [];
  for (const visita of visitasActuales) {
    const fecha = visita.fechaRealizada || visita.solicitud.fechaCierre;
    if (estadoNormalizado(visita.solicitud.estado) === "COMPLETADO" && estadoNormalizado(visita.resultadoVisita) !== "NO SE REALIZO" && fecha && fechaVigente(fecha)) {
      referenciasVigentes.push({ ticketId: visita.solicitud.id, estado: visita.solicitud.estado, fecha });
    }
  }
  for (const visita of visitasHistoricas) {
    if (visita.fechaVisitaDate && fechaVigente(visita.fechaVisitaDate)) referenciasVigentes.push({ fecha: visita.fechaVisitaDate });
  }

  const referenciaVigente = referenciasVigentes.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())[0] || null;
  const vigente = referenciaVigente ? datosVigencia(referenciaVigente) : null;
  return { cedula: cedulaNormalizada, pendiente: pendienteActual, vigente };
}
