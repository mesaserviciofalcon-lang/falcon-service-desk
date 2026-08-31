import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { puedeAdministrarActividades } from "@/lib/actividadesSupervisores";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!puedeAdministrarActividades(session?.user?.role)) {
    return Response.json({ error: "No tiene permiso para administrar las listas" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const tipo = String(body.tipo || "").trim().toUpperCase();
    const valor = String(body.valor || "").trim().toUpperCase();
    if (!['FINCA', 'ACTIVIDAD', 'AREA'].includes(tipo) || !valor) {
      return Response.json({ error: "Seleccione una lista e ingrese un valor válido" }, { status: 400 });
    }
    const catalogo = await prisma.catalogoActividad.create({ data: { tipo, valor } });
    return Response.json({ ok: true, catalogo });
  } catch (error: any) {
    if (error?.code === "P2002") return Response.json({ error: "Esta opción ya existe" }, { status: 409 });
    console.error(error);
    return Response.json({ error: "No fue posible guardar la opción" }, { status: 500 });
  }
}
