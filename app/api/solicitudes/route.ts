import { prisma } from "@/lib/prisma";

import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { enviarCorreo }
from "@/lib/email";

import { correosResponsables }
from "@/lib/correos";

import {

ticketCreadoTemplate,

ticketAsignadoTemplate,

} from "@/lib/templatesEmail";

import { leerRegistrosAntecedentesDesdeUrl }
from "@/lib/antecedentesExcel";

import { ocultarSolicitudesHistoricas }
from "@/lib/solicitudesHistoricas";

import { autocompletarAntecedentes }
from "@/lib/autocompletarAntecedentes";

import { solicitantePuedeVerSolicitud }
from "@/lib/visibilidadSolicitudes";

const rolesVistaTotal = [
  "ADMIN",
  "DIRECTOR_SEG",
  "JEFE_SEG",
  "SUPERVISOR",
  "VISITA",
  "TECNICO",
];

export async function POST(
  request: Request
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
            "Debe iniciar sesion para crear solicitudes",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const solicitanteSolicitud =
      session.user.name ||
      body.solicitante ||
      "Usuario";

    const correoSolicitanteSolicitud =
      session.user.email ||
      body.correoSolicitante;

    const fincaSolicitud =
      session.user.fincaEAI ||
      body.fincaEAI ||
      "";

    const archivoAntecedentesExcel =
      body.tipo === "ANTECEDENTES"
        ? body.archivos?.find(
            (archivo: any) =>
              archivo.tipo?.includes(
                "sheet"
              ) ||
              archivo.nombre?.match(
                /\.(xlsx|xls)$/i
              )
          )
        : null;

    if (
      body.tipo === "ANTECEDENTES" &&
      !archivoAntecedentesExcel?.url
    ) {
      return Response.json(

        {
          error:
            "Debe adjuntar un archivo Excel para antecedentes",
        },

        {
          status: 400,
        }
      );
    }

    const registrosAntecedentesBase =
      body.tipo === "ANTECEDENTES"
        ? await leerRegistrosAntecedentesDesdeUrl(
            archivoAntecedentesExcel.url,
            archivoAntecedentesExcel.nombre
          )
        : [];

    const registrosAntecedentes =
      body.tipo === "ANTECEDENTES"
        ? await autocompletarAntecedentes(
            registrosAntecedentesBase
          )
        : [];

    let asignadoA = "";

    // ASIGNACIONES

    if (
      body.tipo === "CCTV" ||
      body.tipo === "RADIOS"
    ) {

      asignadoA =
        "JEFE_SEG / DIRECTOR_SEG";
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
            solicitanteSolicitud,

          correoSolicitante:
            correoSolicitanteSolicitud,

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
              fincaSolicitud,

            camaraAfectada:
              body.camaraAfectada,

            descripcionFalla:
              body.descripcion,
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

            fechaExpedicion:
              body.fechaExpedicion,

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
              fincaSolicitud,

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
              fincaSolicitud,

            descripcion:
              body.descripcion,
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
              fincaSolicitud,

            observaciones:
              body.descripcion,
          },
        });

      if (
        registrosAntecedentes.length > 0
      ) {

        await prisma
          .antecedenteRegistro
          .createMany({

            data:
              registrosAntecedentes.map(
                (registro) => ({

                  solicitudId:
                    solicitud.id,

                  fechaSolicitud:
                    registro.fechaSolicitud,

                  fechaRespuesta:
                    registro.fechaRespuesta,

                  eai:
                    registro.eai,

                  nombresApellidos:
                    registro.nombresApellidos,

                  tipoDocumento:
                    registro.tipoDocumento,

                  identificacion:
                    registro.identificacion,

                  fechaExpedicionDocumento:
                    registro
                      .fechaExpedicionDocumento,

                  observacion:
                    registro.observacion,

                  motivo:
                    registro.motivo,

                  observaciones:
                    registro.observaciones,
                })
              ),
          });
      }
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
              fincaSolicitud,

            contexto:
              body.descripcion,
          },
        });
    }
    // CORREO RESPONSABLES

const responsables =

  correosResponsables[
    body.tipo as keyof typeof correosResponsables
  ];
const responsableCorreo =

  responsables?.[0] || "";

const responsableNombre =

  responsableCorreo
    .split("@")[0]
    .replace(".", " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
// ENVIAR CORREO

if (correoSolicitanteSolicitud) {

  try {

    await enviarCorreo({

      to:
        correoSolicitanteSolicitud,

      subject:
        `Ticket #${solicitud.id} creado`,

      html: ticketCreadoTemplate({

  ticket:
    solicitud.id,

  tipo:
    solicitud.tipo,

  estado:
    solicitud.estado,

  responsable:
    responsableNombre || "Mesa de Servicios",

  correo:
    responsableCorreo || "No disponible",
}),
    });

  } catch (error) {

    console.error(
      "Error enviando correo al solicitante",
      error
    );
  }
}
if (
  responsables &&
  responsables.length > 0
) {

  try {

    await enviarCorreo({

      to:
        responsables.join(","),

      subject:
        `Nuevo ticket #${solicitud.id}`,

      html: ticketAsignadoTemplate({

  ticket:
    solicitud.id,

  tipo:
    body.tipo,

  solicitante:
    solicitanteSolicitud,
}),
    });

  } catch (error) {

    console.error(
      "Error enviando correo a responsables",
      error
    );
  }
}
    return Response.json(
      solicitud
    );

  } catch (error: any) {

    console.error(error);

    return Response.json(

      {
        error:
          error.message ||
          "Error al crear solicitud",
      },

      {
        status: 400,
      }
    );
  }
}

export async function GET() {

  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user?.email) {
      return Response.json(
        {
          error:
            "Debe iniciar sesion para consultar solicitudes",
        },
        {
          status: 401,
        }
      );
    }

    const solicitudes =
      ocultarSolicitudesHistoricas(
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
      })
      );

    const tieneVistaTotal =
      rolesVistaTotal.includes(
        session.user.role || ""
      );

    const solicitudesVisibles =
      tieneVistaTotal
        ? solicitudes
        : solicitudes.filter(
            (solicitud) =>
              solicitantePuedeVerSolicitud(
                solicitud,
                session.user.email,
                session.user.fincaEAI
              )
          );

    return Response.json(
      solicitudesVisibles
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
