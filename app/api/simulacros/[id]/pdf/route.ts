import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { definicionSimulacro } from "@/lib/simulacros";
import { generarPdfSimulacro } from "@/lib/simulacrosPdf";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const sesion = await getServerSession(authOptions);
  if (!sesion?.user?.email) return Response.json({ error: "Debe iniciar sesión" }, { status: 401 });
  const { id } = await context.params;
  const simulacro = await prisma.simulacroActividad.findUnique({ where: { id: Number(id) }, include: { actividadSupervisor: true } });
  if (!simulacro) return Response.json({ error: "Simulacro no encontrado" }, { status: 404 });
  const definicion = definicionSimulacro(simulacro.tipo, simulacro.area, simulacro.finca);
  const esJefatura = ["ADMIN", "JEFE_SEG", "DIRECTOR_SEG"].includes(String(sesion.user.role || ""));
  const esAnalista = sesion.user.cargo === "ANALISTA SIG" && definicion?.correoAnalista?.toLowerCase() === sesion.user.email.toLowerCase();
  if (!esJefatura && !esAnalista) return Response.json({ error: "No tiene permiso para ver este informe" }, { status: 403 });
  const pdf = await generarPdfSimulacro({ id: simulacro.id, consecutivo: simulacro.consecutivo, tipo: simulacro.tipo, finca: simulacro.finca, area: simulacro.area, fecha: simulacro.createdAt, horaInicio: simulacro.horaInicio, duracionMinutos: simulacro.duracionMinutos, coordinador: simulacro.creadoPor, analista: definicion?.analista || "Analista SIG", objetivo: definicion?.objetivo || "No registrado", riesgo: definicion?.riesgo || "No registrado", controles: definicion?.controles || [], guion: simulacro.guion, resultado: simulacro.resultado, promedioEvaluacion: simulacro.promedioEvaluacion, cumplimientoObjetivo: simulacro.cumplimientoObjetivo, desarrollo: simulacro.desarrollo, aspectos: simulacro.aspectos as any, conclusion: simulacro.conclusion, controlVulnerado: simulacro.controlVulnerado, razonIncumplimiento: simulacro.razonIncumplimiento, factoresFalla: simulacro.factoresFalla as string[] | null, requiereSac: simulacro.requiereSac });
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${simulacro.consecutivo || `simulacro-${simulacro.id}`}.pdf"` } });
}
