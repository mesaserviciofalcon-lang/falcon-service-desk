import { prisma }
from "@/lib/prisma";

import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { enviarCorreo }
from "@/lib/email";

import { correosResponsables }
from "@/lib/correos";

import { solicitantePuedeVerSolicitud }
from "@/lib/visibilidadSolicitudes";

import {

  ticketActualizadoTemplate,

} from "@/lib/templatesEmail";

const rolesGestores = [
  "ADMIN",
  "DIRECTOR_SEG",
  "JEFE_SEG",
  "SUPERVISOR",
  "VISITA",
  "TECNICO",
];

export async function PATCH(

  request: Request,

  context: {

    params: Promise<{
      id: string;
    }>;
  }
) {

  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user?.email) {
      return Response.json(
        {
          error:
            "Debe iniciar sesion para actualizar tickets",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const params =
      await context.params;

    const id =
      Number(params.id);

    const solicitudActual =
      await prisma.solicitud.findUnique({
        where: {
          id,
        },
        include: {
          antecedente: true,
        },
      });

    if (!solicitudActual) {
      return Response.json(
        {
          error:
            "Ticket no encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const estadoSolicitado =
      String(body.estado || "");

    const esGestor =
      rolesGestores.includes(
        session.user.role || ""
      );

    const esReaperturaValida =
      estadoSolicitado === "REABIERTO" &&
      solicitudActual.estado ===
        "COMPLETADO" &&
      solicitantePuedeVerSolicitud(
        solicitudActual,
        session.user.email,
        session.user.fincaEAI
      );

    const esGestionValida =
      esGestor &&
      [
        "EN PROCESO",
        "COMPLETADO",
        "REABIERTO",
      ].includes(
        estadoSolicitado
      );

    const esActualizacionSolicitanteReabierto =
      !estadoSolicitado &&
      solicitudActual.estado ===
        "REABIERTO" &&
      solicitantePuedeVerSolicitud(
        solicitudActual,
        session.user.email,
        session.user.fincaEAI
      );

    if (
      !esGestionValida &&
      !esReaperturaValida &&
      !esActualizacionSolicitanteReabierto
    ) {
      return Response.json(
        {
          error:
            "No tiene permiso para cambiar este estado",
        },
        {
          status: 403,
        }
      );
    }

    const gestionadoPor =
      session.user.name ||
      body.gestionadoPor ||
      "SISTEMA";

    const estadoFinal =
      esActualizacionSolicitanteReabierto
        ? solicitudActual.estado
        : estadoSolicitado;

    // ACTUALIZAR TICKET

    const solicitud =
      await prisma.solicitud.update({

        where: {
          id: id,
        },

        data: {

          estado:
            estadoFinal,

          observacionesTecnico:
            body.observacionesTecnico || "",

          gestionadoPor:
            gestionadoPor,

          fechaGestion:
            new Date(),

          fechaCierre:

            estadoFinal ===
            "COMPLETADO"

              ? new Date()

              : null,
        },
      });

    // HISTORIAL

    await prisma.gestionTicket.create({

      data: {

        solicitudId:
          id,

        usuario:
          gestionadoPor,

        estado:
          estadoFinal,

        observacion:
          body.observacionesTecnico || "",
      },
    });
// ENVIAR CORREO CAMBIO ESTADO

if (
  solicitud.correoSolicitante
) {

  try {

    await enviarCorreo({

      to:
        solicitud.correoSolicitante,

      subject:
        `Actualización Ticket #${solicitud.id}`,

      html: ticketActualizadoTemplate({

  ticket:
    solicitud.id,

  estado:
    estadoFinal,

  gestionadoPor:
    gestionadoPor,

  observacion:
    body.observacionesTecnico || "Sin observación",
}),
    });

  } catch (error) {

    console.error(
      "Error enviando correo actualización ticket",
      error
    );
  }
}


// SI FUE REABIERTO
// NOTIFICAR RESPONSABLES

if (
  estadoFinal ===
  "REABIERTO"
  && !esActualizacionSolicitanteReabierto
) {

  const responsables =

    correosResponsables[
      solicitud.tipo as keyof typeof correosResponsables
    ];

  if (
    responsables &&
    responsables.length > 0
  ) {

    try {

      await enviarCorreo({

        to:
          responsables.join(","),

        subject:
          `Ticket #${solicitud.id} REABIERTO`,

        html: ticketActualizadoTemplate({

  ticket:
    solicitud.id,

  estado:
    "REABIERTO",

  gestionadoPor:
    gestionadoPor,

  observacion:
    body.observacionesTecnico || "Sin observación",
}),
      });

    } catch (error) {

      console.error(
        "Error enviando correo ticket reabierto",
        error
      );
    }
  }
}

return Response.json(
  solicitud
);

} catch (error) {

  console.error(error);

  return Response.json(

    {
      error:
        "Error al actualizar ticket",
    },

    {
      status: 500,
    }
  );
}
}

export async function DELETE(

  _request: Request,

  context: {

    params: Promise<{
      id: string;
    }>;
  }
) {

  const session =
    await getServerSession(
      authOptions
    );

  if (
    session?.user?.role !==
    "ADMIN"
  ) {

    return Response.json(

      {
        error:
          "No tiene permiso para eliminar tickets",
      },

      {
        status: 403,
      }
    );
  }

  try {

    const params =
      await context.params;

    const id =
      Number(params.id);

    await prisma.$transaction([

      prisma.gestionTicket.deleteMany({
        where: {
          solicitudId: id,
        },
      }),

      prisma.archivoAdjunto.deleteMany({
        where: {
          solicitudId: id,
        },
      }),

      prisma.antecedenteRegistro.deleteMany({
        where: {
          solicitudId: id,
        },
      }),

      prisma.solicitudCCTV.deleteMany({
        where: {
          solicitudId: id,
        },
      }),

      prisma.solicitudVisita.deleteMany({
        where: {
          solicitudId: id,
        },
      }),

      prisma.solicitudRadio.deleteMany({
        where: {
          solicitudId: id,
        },
      }),

      prisma.solicitudAntecedente.deleteMany({
        where: {
          solicitudId: id,
        },
      }),

      prisma.seguridadNovedad.deleteMany({
        where: {
          solicitudId: id,
        },
      }),

      prisma.solicitud.delete({
        where: {
          id,
        },
      }),
    ]);

    return Response.json({
      ok: true,
    });

  } catch (error) {

    console.error(error);

    return Response.json(

      {
        error:
          "Error al eliminar ticket",
      },

      {
        status: 500,
      }
    );
  }
}
