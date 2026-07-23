import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

import {
  puedeVerAntecedenteCompleto,
} from "@/lib/antecedentesCatalogos";

import {
  leerRegistrosAntecedentesHistoricoDesdeUrl,
} from "@/lib/antecedentesExcel";

const TAMANO_BLOQUE = 1000;

function dividirEnBloques<T>(
  items: T[],
  tamano: number
) {
  const bloques: T[][] = [];

  for (
    let index = 0;
    index < items.length;
    index += tamano
  ) {
    bloques.push(
      items.slice(index, index + tamano)
    );
  }

  return bloques;
}

export async function POST(
  request: Request
) {
  const session =
    await getServerSession(
      authOptions
    );

  if (
    !puedeVerAntecedenteCompleto(
      session?.user?.role
    )
  ) {
    return Response.json(
      {
        error:
          "No tiene permiso para importar historico",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const body =
      await request.json();

    if (!body.url) {
      return Response.json(
        {
          error:
            "Archivo requerido",
        },
        {
          status: 400,
        }
      );
    }

    const registros =
      await leerRegistrosAntecedentesHistoricoDesdeUrl(
        body.url,
        body.nombre
      );

    if (registros.length === 0) {
      return Response.json(
        {
          error:
            "El archivo no tiene registros para importar",
        },
        {
          status: 400,
        }
      );
    }

    const solicitud =
      await prisma.solicitud.create({

        data: {
          tipo: "ANTECEDENTES",
          solicitante:
            session?.user?.name ||
            "IMPORTACION HISTORICA",
          correoSolicitante:
            session?.user?.email,
          estado: "COMPLETADO",
          asignadoA: "SEGURIDAD",
          gestionadoPor:
            session?.user?.name ||
            "SISTEMA",
          fechaGestion: new Date(),
          fechaCierre: new Date(),
          antecedente: {
            create: {
              fincaEAI: "HISTORICO",
              observaciones:
                "Importacion historica de antecedentes",
            },
          },
          archivos: {
            create: [{
              nombre:
                body.nombre ||
                "historico-antecedentes.xlsx",
              ruta: body.url,
              tipo:
                body.tipo ||
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }],
          },
        },
      });

    const bloques =
      dividirEnBloques(
        registros,
        TAMANO_BLOQUE
      );

    for (const bloque of bloques) {
      await prisma
        .antecedenteRegistro
        .createMany({
          data:
            bloque.map(
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
                revisadoPor:
                  registro.revisadoPor,
                motivo:
                  registro.motivo,
                autorizacion:
                  registro.autorizacion,
                observaciones:
                  registro.observaciones,
              })
            ),
        });
    }

    return Response.json({
      solicitudId: solicitud.id,
      registros:
        registros.length,
    });

  } catch (error: any) {
    console.error(error);

    return Response.json(
      {
        error:
          error.message ||
          "Error importando historico",
      },
      {
        status: 500,
      }
    );
  }
}
