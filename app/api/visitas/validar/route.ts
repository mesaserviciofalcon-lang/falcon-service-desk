import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeVerTodasLasFincasEnVisitas } from "@/lib/permisosConsultasSeguridad";
import { validarVisitaPorCedula } from "@/lib/validacionVisitasDuplicadas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Debe iniciar sesión" }, { status: 401 });
  const cedula = new URL(request.url).searchParams.get("cedula");
  const usuario = await prisma.usuario.findUnique({ where: { email: session.user.email }, select: { fincaEAI: true } });
  const finca = puedeVerTodasLasFincasEnVisitas(session.user.role) ? null : usuario?.fincaEAI;
  return Response.json(await validarVisitaPorCedula(cedula, finca));
}
