import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { esDelAnoActualColombia, mismaFincaSimulacro } from "@/lib/simulacros";
import { generarPdfSac } from "@/lib/simulacrosPdf";
import { prisma } from "@/lib/prisma";
import { esAnalistaSig } from "@/lib/permisosUsuarios";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new Response("No autorizado", { status: 401 });
  const { id } = await context.params;
  const simulacro = await prisma.simulacroActividad.findUnique({ where: { id: Number(id) }, include: { solicitudAccion: true } });
  if (!simulacro?.solicitudAccion) return new Response("SAC no encontrada", { status: 404 });
  const sac = simulacro.solicitudAccion;
  const usuario = await prisma.usuario.findUnique({ where: { email: session.user.email }, select: { cargo: true, fincaEAI: true } });
  const esAnalista = esAnalistaSig(usuario?.cargo) && mismaFincaSimulacro(usuario?.fincaEAI, simulacro.finca);
  const esSupervisor = session.user.role === "SUPERVISOR";
  if (!esAnalista && !esSupervisor && !["ADMIN", "JEFE_SEG", "DIRECTOR_SEG"].includes(String(session.user.role || ""))) return new Response("No autorizado", { status: 403 });
  if (!["ADMIN", "JEFE_SEG"].includes(String(session.user.role || "")) && !esDelAnoActualColombia(simulacro.createdAt)) return new Response("El histórico solo está disponible para Administración y Jefe de Seguridad", { status: 403 });
  const pdf = await generarPdfSac({ ...sac, consecutivo: sac.consecutivo || `SAC-${simulacro.finca}-${String(simulacro.id).padStart(4, "0")}`, finca: simulacro.finca, factoresCausa: sac.factoresCausa as string[], correcciones: sac.correcciones as any, planAccion: sac.planAccion as any, seguimiento: sac.seguimiento as any });
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${sac.consecutivo || "sac"}.pdf"` } });
}
