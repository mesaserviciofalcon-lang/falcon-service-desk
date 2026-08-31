import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { normalizarCorreo, puedeAdministrarActividades } from "@/lib/actividadesSupervisores";
import { definicionSimulacro } from "@/lib/simulacros";
import { generarPdfSimulacro } from "@/lib/simulacrosPdf";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await context.params;
  const actividad = await prisma.actividadSupervisor.findUnique({ where: { id: Number(id) }, include: { simulacro: true } });
  if (!actividad?.simulacro) return new Response("Informe no encontrado", { status: 404 });
  const esSupervisor = session?.user?.role === "SUPERVISOR" && normalizarCorreo(actividad.supervisorCorreo) === normalizarCorreo(session.user.email);
  if (!esSupervisor && !puedeAdministrarActividades(session?.user?.role)) return new Response("No autorizado", { status: 403 });
  const definicion = definicionSimulacro(actividad.actividad, actividad.area, actividad.finca);
  if (!definicion) return new Response("Tipo no configurado", { status: 400 });
  const simulacro = actividad.simulacro;
  const pdf = await generarPdfSimulacro({
    id: simulacro.id, tipo: simulacro.tipo, finca: simulacro.finca, area: simulacro.area, fecha: actividad.fechaCierre || simulacro.createdAt,
    horaInicio: simulacro.horaInicio, coordinador: simulacro.creadoPor, analista: definicion.analista, objetivo: definicion.objetivo,
    riesgo: definicion.riesgo, controles: definicion.controles, guion: simulacro.guion, resultado: simulacro.resultado,
    cumplimientoObjetivo: simulacro.cumplimientoObjetivo, desarrollo: simulacro.desarrollo, aspectos: simulacro.aspectos as any,
    conclusion: simulacro.conclusion, controlVulnerado: simulacro.controlVulnerado, razonIncumplimiento: simulacro.razonIncumplimiento,
    factoresFalla: simulacro.factoresFalla as string[] | null, requiereSac: simulacro.requiereSac,
  });
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="simulacro-${actividad.finca}-${simulacro.id}.pdf"` } });
}
