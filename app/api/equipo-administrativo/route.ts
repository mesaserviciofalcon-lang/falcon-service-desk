import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { puedeAdministrarAnuario } from "@/lib/permisosAnuario";
import { prisma } from "@/lib/prisma";

function formatearTexto(valor: unknown) {
  return String(valor || "")
    .trim()
    .toLocaleLowerCase("es-CO")
    .replace(
      /(^|\s)(\S)/g,
      (_, espacio: string, letra: string) =>
        `${espacio}${letra.toLocaleUpperCase("es-CO")}`
    );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (
    !puedeAdministrarAnuario({
      rol: session?.user?.role,
    })
  ) {
    return Response.json(
      { error: "No tiene permiso para registrar integrantes del equipo" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const nombres = formatearTexto(body.nombres);
  const apellidos = formatearTexto(body.apellidos);
  const cargo = formatearTexto(body.cargo);
  const fotoUrl = String(body.fotoUrl || "").trim();

  if (!nombres || !apellidos || !cargo || !fotoUrl) {
    return Response.json(
      { error: "Nombres, apellidos, cargo y foto son obligatorios" },
      { status: 400 }
    );
  }

  const integrante = await prisma.equipoAdministrativo.create({
    data: {
      nombres,
      apellidos,
      cargo,
      fotoUrl,
    },
  });

  return Response.json(integrante, { status: 201 });
}
