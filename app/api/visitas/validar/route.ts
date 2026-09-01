import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { validarVisitaPorCedula } from "@/lib/validacionVisitasDuplicadas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Debe iniciar sesión" }, { status: 401 });
  const cedula = new URL(request.url).searchParams.get("cedula");
  return Response.json(await validarVisitaPorCedula(cedula));
}
