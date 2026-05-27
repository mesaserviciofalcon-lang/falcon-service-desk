import { prisma }
from "@/lib/prisma";

import { enviarCorreo }
from "@/lib/email";

import { correosResponsables }
from "@/lib/correos";

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

      html: `

        <div style="
          font-family: Arial;
          padding: 20px;
        ">

          <h2>
            Actualización de ticket
          </h2>

          <hr />

          <p>

            <strong>
              Ticket:
            </strong>

            #${solicitud.id}

          </p>

          <p>

            <strong>
              Nuevo estado:
            </strong>

            ${body.estado}

          </p>

          <p>

            <strong>
              Gestionado por:
            </strong>

            ${body.gestionadoPor || "Sistema"}

          </p>

          <p>

            <strong>
              Observación:
            </strong>

            ${body.observacionesTecnico || "Sin observación"}

          </p>

        </div>
      `,
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

        html: `

          <div style="
            font-family: Arial;
            padding: 20px;
          ">

            <h2>
              Ticket reabierto
            </h2>

            <hr />

            <p>

              <strong>
                Ticket:
              </strong>

              #${solicitud.id}

            </p>

            <p>

              <strong>
                Tipo:
              </strong>

              ${solicitud.tipo}

            </p>

            <p>

              <strong>
                Reabierto por:
              </strong>

              ${body.gestionadoPor || "Solicitante"}

            </p>

            <p>

              <strong>
                Observación:
              </strong>

              ${body.observacionesTecnico || "Sin observación"}

            </p>

          </div>
        `,
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
