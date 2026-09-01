import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { puedeAdministrarActividades } from "@/lib/actividadesSupervisores";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await context.params;
  const actividad = await prisma.actividadSupervisor.findUnique({ where: { id: Number(id) }, include: { simulacro: true } });
  if (!actividad?.simulacro) return new Response("Informe no encontrado", { status: 404 });
  const esSupervisor = session?.user?.role === "SUPERVISOR";
  if (!esSupervisor && !puedeAdministrarActividades(session?.user?.role)) return new Response("No autorizado", { status: 403 });
  return Response.redirect(new URL(`/api/simulacros/${actividad.simulacro.id}/pdf`, _request.url));
}
