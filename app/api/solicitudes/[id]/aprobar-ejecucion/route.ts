import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import {
  ESTADO_CCTV_APROBADO,
  obtenerTecnicoCctvPorEai,
  puedeAprobarEjecucionCctv,
} from "@/lib/cctvEjecucion";

import { enviarCorreo } from "@/lib/email";

import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json(
      { error: "Debe iniciar sesion" },
      { status: 401 }
    );
  }

  if (
    !puedeAprobarEjecucionCctv(
      session.user.role
    )
  ) {
    return Response.json(
      {
        error:
          "No tiene permiso para aprobar ejecuciones de CCTV",
      },
      { status: 403 }
    );
  }

  const { id: idParam } =
    await context.params;
  const id = Number(idParam);

  if (!Number.isSafeInteger(id) || id < 1) {
    return Response.json(
      { error: "Ticket no valido" },
      { status: 400 }
    );
  }

  const solicitud =
    await prisma.solicitud.findUnique({
      where: { id },
      include: { cctv: true },
    });

  if (!solicitud || solicitud.tipo !== "CCTV") {
    return Response.json(
      { error: "Ticket CCTV no encontrado" },
      { status: 404 }
    );
  }

  const estadoActual = String(
    solicitud.estado || ""
  )
    .trim()
    .toUpperCase();

  if (
    !["PENDIENTE", "REABIERTO"].includes(
      estadoActual
    )
  ) {
    return Response.json(
      {
        error:
          "Este ticket no esta pendiente de aprobacion",
      },
      { status: 400 }
    );
  }

  const tecnico =
    obtenerTecnicoCctvPorEai(
      solicitud.cctv?.fincaEAI
    );

  if (!tecnico) {
    return Response.json(
      {
        error:
          "La EAI del ticket no tiene un tecnico CCTV configurado",
      },
      { status: 400 }
    );
  }

  const aprobador =
    session.user.name ||
    session.user.email;

  const aprobada =
    await prisma.$transaction(async (tx) => {
      const actualizada =
        await tx.solicitud.update({
          where: { id },
          data: {
            estado: ESTADO_CCTV_APROBADO,
            asignadoA: tecnico.nombre,
            gestionadoPor: aprobador,
            observacionesTecnico:
              "Aprobado para ejecucion tecnica de CCTV",
            fechaGestion: new Date(),
            fechaCierre: null,
          },
        });

      await tx.gestionTicket.create({
        data: {
          solicitudId: id,
          usuario: aprobador,
          estado: ESTADO_CCTV_APROBADO,
          observacion:
            `Aprobado para ejecucion y asignado a ${tecnico.nombre}`,
        },
      });

      return actualizada;
    });

  try {
    await enviarCorreo({
      to: tecnico.correo,
      subject: `Ticket CCTV #${id} aprobado para ejecucion`,
      html: `
        <p>El ticket CCTV #${id} de la EAI ${solicitud.cctv?.fincaEAI || "sin EAI"} fue aprobado para ejecucion.</p>
        <p>Ya puede ingresar a Falcon Service Desk para gestionarlo.</p>
      `,
    });
  } catch (error) {
    console.error(
      "Error notificando al tecnico CCTV aprobado",
      error
    );
  }

  return Response.json(aprobada);
}
