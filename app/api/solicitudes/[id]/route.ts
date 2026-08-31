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
  tecnicoPuedeGestionarCctv,
} from "@/lib/cctvEjecucion";

import {
  validarRegistroAntecedente,
} from "@/lib/validacionAntecedentesGestion";

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
          visita: true,
          cctv: true,
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

    const tecnicoPuedeGestionar =
      tecnicoPuedeGestionarCctv({
        rol: session.user.role,
        correo: session.user.email,
        eai:
          solicitudActual.cctv?.fincaEAI,
        estado: solicitudActual.estado,
      });

    const esGestorNoTecnico =
      esGestor &&
      session.user.role !== "TECNICO";

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
      (
        esGestorNoTecnico ||
        tecnicoPuedeGestionar
      ) &&
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

    let gestionadoPor =
      body.gestionadoPor ||
      session.user.name ||
      "SISTEMA";

    const observacionesTecnico =
      String(
        body.observacionesTecnico || ""
      ).trim();

    const estadoFinal =
      esActualizacionSolicitanteReabierto
        ? solicitudActual.estado
        : estadoSolicitado;

    if (
      esGestionValida &&
      !observacionesTecnico
    ) {
      return Response.json(
        {
          error:
            "Debe registrar una observación de la gestión",
        },
        {
          status: 400,
        }
      );
    }

    const resultadoVisita =
      String(
        body.resultadoVisita || ""
      )
        .trim()
        .toUpperCase();

    if (
      solicitudActual.tipo ===
        "VISITA DOMICILIARIA" &&
      esGestionValida &&
      estadoFinal === "COMPLETADO" &&
      ![
        "CONFIABLE",
        "NO CONFIABLE",
        "NO SE REALIZO",
      ].includes(resultadoVisita)
    ) {
      return Response.json(
        {
          error:
            "Debe seleccionar el resultado de la visita",
        },
        {
          status: 400,
        }
      );
    }

    if (
      solicitudActual.tipo ===
        "ANTECEDENTES" &&
      esGestionValida &&
      estadoFinal === "COMPLETADO"
    ) {
      const registrosAntecedentes =
        await prisma
          .antecedenteRegistro
          .findMany({
            where: {
              solicitudId: id,
            },
            select: {
              identificacion: true,
              observacion: true,
              revisadoPor: true,
              motivo: true,
              observaciones: true,
            },
          });

      if (
        registrosAntecedentes.length ===
        0
      ) {
        return Response.json(
          {
            error:
              "No hay registros de antecedentes para cerrar este ticket",
          },
          {
            status: 400,
          }
        );
      }

      const errorAntecedente =
        registrosAntecedentes
          .map(
            validarRegistroAntecedente
          )
          .find(Boolean);

      if (errorAntecedente) {
        return Response.json(
          {
            error:
              errorAntecedente,
          },
          {
            status: 400,
          }
        );
      }

      const revisores =
        Array.from(
          new Set(
            registrosAntecedentes
              .map((registro) =>
                registro.revisadoPor?.trim()
              )
              .filter(Boolean)
          )
        );

      if (revisores.length > 0) {
        gestionadoPor =
          revisores.join(", ");
      }
    }

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
            observacionesTecnico,

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

    if (
      solicitudActual.tipo ===
        "VISITA DOMICILIARIA" &&
      esGestionValida &&
      resultadoVisita
    ) {
      await prisma.solicitudVisita.update({
        where: {
          solicitudId: id,
        },
        data: {
          resultadoVisita,
          fechaRealizada:
            estadoFinal ===
            "COMPLETADO"
              ? new Date()
              : undefined,
        },
      });
    }

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
          observacionesTecnico,
      },
    });
// ENVIAR CORREO CAMBIO ESTADO

const esCierre = estadoFinal === "COMPLETADO";
const copiasCierre =
  esCierre &&
  ["CCTV", "NOVEDAD SEGURIDAD"].includes(solicitud.tipo)
    ? correosResponsables[
        solicitud.tipo as keyof typeof correosResponsables
      ] || []
    : [];
const destinatarios = Array.from(
  new Set(
    [solicitud.correoSolicitante, ...copiasCierre]
      .map((correo) => String(correo || "").trim().toLowerCase())
      .filter(Boolean)
  )
);
const correoPrincipal = solicitud.correoSolicitante
  ? String(solicitud.correoSolicitante).trim().toLowerCase()
  : destinatarios[0];
const copias = destinatarios.filter(
  (correo) => correo !== correoPrincipal
);
let correoActualizacionEnviado = false;

if (correoPrincipal) {
  try {
    await enviarCorreo({
      to: correoPrincipal,
      cc: copias.length > 0 ? copias.join(",") : undefined,
      subject: esCierre
        ? `Cierre Ticket #${solicitud.id} - ${solicitud.tipo}`
        : `Actualización Ticket #${solicitud.id}`,

      html: ticketActualizadoTemplate({

  ticket:
    solicitud.id,

  estado:
    estadoFinal,

  gestionadoPor:
    gestionadoPor,

  observacion:
    observacionesTecnico || "Sin observación",
}),
    });

    correoActualizacionEnviado = true;

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
    observacionesTecnico || "Sin observación",
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
  {
    ...solicitud,
    correoActualizacionEnviado,
  }
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
