import { prisma }
from "@/lib/prisma";

import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { leerRegistrosAntecedentesDesdeUrl }
from "@/lib/antecedentesExcel";

import { autocompletarAntecedentes }
from "@/lib/autocompletarAntecedentes";

const rolesGestores = [
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
            "Debe iniciar sesion para adjuntar archivos",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const solicitudId =
      Number(body.solicitudId);

    if (
      !solicitudId ||
      !body.nombre ||
      !body.ruta ||
      !body.tipo
    ) {
      return Response.json(
        {
          error:
            "Datos de archivo incompletos",
        },
        {
          status: 400,
        }
      );
    }

    const solicitud =
      await prisma.solicitud.findUnique({
        where: {
          id: solicitudId,
        },
        include: {
          antecedente: true,
        },
      });

    const esSolicitantePropio =
      solicitud?.correoSolicitante ===
      session.user.email;

    const esAntecedenteMismaFinca =
      solicitud?.tipo ===
      "ANTECEDENTES" &&
      Boolean(
        session.user.fincaEAI
      ) &&
      solicitud.antecedente?.fincaEAI ===
        session.user.fincaEAI;

    const esGestor =
      rolesGestores.includes(
        session.user.role || ""
      );

    const esSolicitante =
      session.user.role ===
      "SOLICITANTE";

    if (
      !solicitud ||
      (!esGestor &&
        !esSolicitantePropio &&
        !esAntecedenteMismaFinca)
    ) {
      return Response.json(
        {
          error:
            "No tiene permiso para adjuntar archivos a este ticket",
        },
        {
          status: 403,
        }
      );
    }

    if (
      esSolicitante &&
      solicitud.estado ===
        "REABIERTO"
    ) {
      const esImagen =
        body.tipo?.includes(
          "image"
        ) ||
        body.nombre?.match(
          /\.(jpg|jpeg|png|webp)$/i
        );

      const esPdf =
        body.tipo ===
          "application/pdf" ||
        body.nombre?.match(
          /\.pdf$/i
        );

      if (!esImagen && !esPdf) {
        return Response.json(
          {
            error:
              "En tickets reabiertos solo puede adjuntar imagenes o PDF",
          },
          {
            status: 400,
          }
        );
      }

      const archivoExistente =
        await prisma
          .archivoAdjunto
          .findFirst({
            where: {
              solicitudId,
              nombre:
                body.nombre,
            },
          });

      if (archivoExistente) {
        return Response.json({
          ...archivoExistente,
          duplicado: true,
        });
      }
    }

    const esExcelAntecedentes =
      solicitud.tipo ===
        "ANTECEDENTES" &&
      !esSolicitante &&
      (
        body.tipo?.includes(
          "sheet"
        ) ||
        body.nombre?.match(
          /\.(xlsx|xls)$/i
        )
      );

    if (esExcelAntecedentes) {
      const registrosBase =
        await leerRegistrosAntecedentesDesdeUrl(
          body.ruta,
          body.nombre
        );

      const registros =
        await autocompletarAntecedentes(
          registrosBase,
          {
            excluirSolicitudId:
              solicitudId,
          }
        );

      if (registros.length === 0) {
        return Response.json(
          {
            error:
              "El Excel no tiene registros validos para reemplazar la tabla",
          },
          {
            status: 400,
          }
        );
      }

      const resultado =
        await prisma.$transaction(
          async (tx) => {
            const archivo =
              await tx.archivoAdjunto.create({
                data: {
                  solicitudId,
                  nombre:
                    body.nombre,
                  ruta:
                    body.ruta,
                  tipo:
                    body.tipo,
                },
              });

            await tx
              .antecedenteRegistro
              .deleteMany({
                where: {
                  solicitudId,
                },
              });

            await tx
              .antecedenteRegistro
              .createMany({
                data:
                  registros.map(
                    (registro) => ({
                      solicitudId,
                      fechaSolicitud:
                        registro.fechaSolicitud,
                      fechaRespuesta:
                        registro.fechaRespuesta,
                      eai:
                        registro.eai,
                      nombresApellidos:
                        registro
                          .nombresApellidos,
                      tipoDocumento:
                        registro
                          .tipoDocumento,
                      identificacion:
                        registro
                          .identificacion,
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

            return {
              ...archivo,
              registrosReemplazados:
                registros.length,
            };
          }
        );

      return Response.json(
        resultado
      );
    }

    const archivo =
      await prisma.archivoAdjunto.create({

        data: {

          solicitudId:
            solicitudId,

          nombre:
            body.nombre,

          ruta:
            body.ruta,

          tipo:
            body.tipo,
        },
      });

    return Response.json(
      archivo
    );

  } catch (error) {

    console.error(error);

    return Response.json(

      {
        error:
          "Error guardando archivo",
      },

      {
        status: 500,
      }
    );
  }
}
