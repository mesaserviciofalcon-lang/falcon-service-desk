import { prisma }
from "@/lib/prisma";

import { enviarCorreo }
from "@/lib/email";

import { correosResponsables }
from "@/lib/correos";

import {

  ticketActualizadoTemplate,

} from "@/lib/templatesEmail";

export async function PATCH(

  request: Request,

  context: {

    params: Promise<{
      id: string;
    }>;
  }
) {

  try {

    const body =
      await request.json();

    const params =
      await context.params;

    const id =
      Number(params.id);

    // ACTUALIZAR TICKET

    const solicitud =
      await prisma.solicitud.update({

        where: {
          id: id,
        },

        data: {

          estado:
            body.estado,

          observacionesTecnico:
            body.observacionesTecnico || "",

          gestionadoPor:
            body.gestionadoPor || "SISTEMA",

          fechaGestion:
            new Date(),

          fechaCierre:

            body.estado ===
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
          body.gestionadoPor || "SISTEMA",

        estado:
          body.estado,

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
    body.estado,

  gestionadoPor:
    body.gestionadoPor || "Sistema",

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
  body.estado ===
  "REABIERTO"
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
    body.gestionadoPor || "Solicitante",

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
