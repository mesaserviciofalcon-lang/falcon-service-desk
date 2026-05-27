import { prisma } from "@/lib/prisma";

import { enviarCorreo }
from "@/lib/email";

import { correosResponsables }
from "@/lib/correos";

export async function POST(
  request: Request
) {

  try {

    const body =
      await request.json();

    let asignadoA = "";

    // ASIGNACIONES

    if (
      body.tipo === "CCTV" ||
      body.tipo === "RADIOS"
    ) {

      asignadoA =
        "TECNICO";
    }

    if (
      body.tipo ===
      "VISITA DOMICILIARIA"
    ) {

      asignadoA =
        "ADRIANA GARCIA";
    }

    if (
      body.tipo ===
      "ANTECEDENTES"
    ) {

      asignadoA =
        "SEGURIDAD";
    }

    if (
      body.tipo ===
      "NOVEDAD SEGURIDAD"
    ) {

      asignadoA =
        "SEGURIDAD";
    }

    // CREAR SOLICITUD PRINCIPAL

    const solicitud =
      await prisma.solicitud.create({

        data: {

          tipo:
            body.tipo,

          solicitante:
            body.solicitante,

          correoSolicitante:
            body.correoSolicitante,

          asignadoA,
          archivos: {

  create:

    body.archivos?.map(
      (archivo: any) => ({

        nombre:
          archivo.nombre,

        ruta:
          archivo.url,

        tipo:
          archivo.tipo,
      })
    ) || [],
},
        },
      });

    // CCTV

    if (
      body.tipo ===
      "CCTV"
    ) {

      await prisma
        .solicitudCCTV
        .create({

          data: {

            solicitudId:
              solicitud.id,

            fincaEAI:
              body.fincaEAI,

            camaraAfectada:
              body.camaraAfectada,

            descripcionFalla:
              body.descripcion,

            prioridad:
              body.prioridad,
          },
        });
    }

    // VISITA

    if (
      body.tipo ===
      "VISITA DOMICILIARIA"
    ) {

      await prisma
        .solicitudVisita
        .create({

          data: {

            solicitudId:
              solicitud.id,

            nombreCandidato:
              body.nombreCandidato,

            cedula:
              body.cedula,

            telefono:
              body.telefono,

            direccion:
              body.direccion,

            municipio:
              body.municipio,

            zona:
              body.zona,

            cargo:
              body.cargo,

            fincaEAI:
              body.fincaEAI,

            motivoVisita:
              body.motivoVisita,
          },
        });
    }

    // RADIOS

    if (
      body.tipo ===
      "RADIOS"
    ) {

      await prisma
        .solicitudRadio
        .create({

          data: {

            solicitudId:
              solicitud.id,

            radio:
              body.radio,

            serial:
              body.serial,

            tipoFalla:
              body.tipoFalla,

            fincaEAI:
              body.fincaEAI,

            descripcion:
              body.descripcion,

            prioridad:
              body.prioridad,
          },
        });
    }

    // ANTECEDENTES

    if (
      body.tipo ===
      "ANTECEDENTES"
    ) {

      await prisma
        .solicitudAntecedente
        .create({

          data: {

            solicitudId:
              solicitud.id,

            fincaEAI:
              body.fincaEAI,

            observaciones:
              body.descripcion,

            prioridad:
              body.prioridad,
          },
        });
    }

    // NOVEDAD SEGURIDAD

    if (
      body.tipo ===
      "NOVEDAD SEGURIDAD"
    ) {

      await prisma
        .seguridadNovedad
        .create({

          data: {

            solicitudId:
              solicitud.id,

            fincaEAI:
              body.fincaEAI,

            contexto:
              body.descripcion,
          },
        });
    }
// ENVIAR CORREO

await enviarCorreo({

  to:
    body.correoSolicitante,

  subject:
    `Ticket #${solicitud.id} creado`,

  html: `

    <div style="font-family: Arial;">

      <h2>
        Mesa de Servicios Falcon
      </h2>

      <p>

        Su solicitud fue creada correctamente.

      </p>

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

        ${body.tipo}

      </p>

      <p>

        <strong>
          Estado:
        </strong>

        PENDIENTE

      </p>

      <p>

        <strong>
          Asignado:
        </strong>

        ${asignadoA}

      </p>

      <br />

      <p>
        Falcon Farms
      </p>

    </div>
  `,
});
// CORREO RESPONSABLES

const responsables =

  correosResponsables[
    body.tipo as keyof typeof correosResponsables
  ];

if (
  responsables &&
  responsables.length > 0
) {

  await enviarCorreo({

  to:
    responsables.join(","),

  subject:
      `Nuevo ticket #${solicitud.id}`,

    html: `

      <div style="font-family: Arial;">

        <h2>
          Nuevo ticket asignado
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

          ${body.tipo}

        </p>

        <p>

          <strong>
            Solicitante:
          </strong>

          ${body.solicitante}

        </p>

        <p>

          <strong>
            Estado:
          </strong>

          PENDIENTE

        </p>

      </div>
    `,
  });
}
    return Response.json(
      solicitud
    );

  } catch (error) {

    console.error(error);

    return Response.json(

      {
        error:
          "Error al crear solicitud",
      },

      {
        status: 500,
      }
    );
  }
}

export async function GET() {

  try {

    const solicitudes =
      await prisma.solicitud.findMany({

        include: {

          cctv: true,

          visita: true,

          radio: true,

          antecedente: true,

          novedad: true,

          gestiones: {

            orderBy: {
              fecha: "desc",
            },
          },

          archivos: true,
        },

        orderBy: {

          fechaCreacion:
            "desc",
        },
      });

    return Response.json(
      solicitudes
    );

  } catch (error) {

    console.error(error);

    return Response.json(

      {
        error:
          "Error al obtener solicitudes",
      },

      {
        status: 500,
      }
    );
  }
}
