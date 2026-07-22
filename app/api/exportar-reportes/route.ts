import { prisma } from "@/lib/prisma";

import * as XLSX
from "xlsx";

import { formatearFechaColombia }
from "@/lib/fecha";

export async function GET(
  request: Request
) {

  try {

    const {
      searchParams,
    } = new URL(
      request.url
    );

    const tipo =
      searchParams.get(
        "tipo"
      );

    if (!tipo) {

      return Response.json(

        {
          error:
            "Tipo requerido",
        },

        {
          status: 400,
        }
      );
    }

    const solicitudes =
      await prisma.solicitud.findMany({

        where: {
          tipo,
        },

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

            take: 1,
          },
        },

        orderBy: {

          fechaCreacion:
            "desc",
        },
      });

    let data: any[] = [];

    // CCTV

    if (tipo === "CCTV") {

      data =
        solicitudes.map(
          (item: any) => ({

            ID:
              item.id,

            SOLICITANTE:
              item.solicitante,

            FINCA:
              item.cctv
                ?.fincaEAI,

            CAMARA:
              item.cctv
                ?.camaraAfectada,

            DESCRIPCION:
              item.cctv
                ?.descripcionFalla,

            PRIORIDAD:
              item.cctv
                ?.prioridad,

            ESTADO:
              item.estado,

            FECHA:
              formatearFechaColombia(
                item.fechaCreacion
              ),
          })
        );
    }

    // RADIOS

    if (tipo === "RADIOS") {

      data =
        solicitudes.map(
          (item: any) => ({

            ID:
              item.id,

            SOLICITANTE:
              item.solicitante,

            RADIO:
              item.radio
                ?.radio,

            SERIAL:
              item.radio
                ?.serial,

            FALLA:
              item.radio
                ?.tipoFalla,

            FINCA:
              item.radio
                ?.fincaEAI,

            PRIORIDAD:
              item.radio
                ?.prioridad,

            ESTADO:
              item.estado,

            FECHA:
              formatearFechaColombia(
                item.fechaCreacion
              ),
          })
        );
    }

    // VISITAS

    if (
      tipo ===
      "VISITA DOMICILIARIA"
    ) {

      data =
        solicitudes.map(
          (item: any) => ({

            ID:
              item.id,

            CANDIDATO:
              item.visita
                ?.nombreCandidato,

            CEDULA:
              item.visita
                ?.cedula,

            FECHA_EXPEDICION:
              item.visita
                ?.fechaExpedicion,

            TELEFONO:
              item.visita
                ?.telefono,

            DIRECCION:
              item.visita
                ?.direccion,

            MUNICIPIO:
              item.visita
                ?.municipio,

            ZONA:
              item.visita
                ?.zona,

            CARGO:
              item.visita
                ?.cargo,

            FINCA:
              item.visita
                ?.fincaEAI,

            MOTIVO:
              item.visita
                ?.motivoVisita,

            ESTADO:
              item.estado,

            OBSERVACION_TECNICA:
              item.gestiones?.[0]
                ?.observacion ||
              item.observacionesTecnico ||
              "",

            FECHA:
              formatearFechaColombia(
                item.fechaCreacion
              ),
          })
        );
    }

    // ANTECEDENTES

    if (
      tipo ===
      "ANTECEDENTES"
    ) {

      data =
        solicitudes.map(
          (item: any) => ({

            ID:
              item.id,

            SOLICITANTE:
              item.solicitante,

            FINCA:
              item.antecedente
                ?.fincaEAI,

            OBSERVACIONES:
              item.antecedente
                ?.observaciones,

            PRIORIDAD:
              item.antecedente
                ?.prioridad,

            ESTADO:
              item.estado,

            FECHA:
              formatearFechaColombia(
                item.fechaCreacion
              ),
          })
        );
    }

    // NOVEDAD SEGURIDAD

    if (
      tipo ===
      "NOVEDAD SEGURIDAD"
    ) {

      data =
        solicitudes.map(
          (item: any) => ({

            ID:
              item.id,

            SOLICITANTE:
              item.solicitante,

            FINCA:
              item.novedad
                ?.fincaEAI,

            CONTEXTO:
              item.novedad
                ?.contexto,

            ESTADO:
              item.estado,

            FECHA:
              formatearFechaColombia(
                item.fechaCreacion
              ),
          })
        );
    }

    const worksheet =
      XLSX.utils
        .json_to_sheet(data);

    const workbook =
      XLSX.utils
        .book_new();

    XLSX.utils.book_append_sheet(

      workbook,

      worksheet,

      "Reporte"
    );

    const excelBuffer =
      XLSX.write(

        workbook,

        {
          bookType: "xlsx",
          type: "buffer",
        }
      );

    return new Response(
      excelBuffer,

      {

        headers: {

          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

          "Content-Disposition":
            `attachment; filename=${tipo}.xlsx`,
        },
      }
    );

  } catch (error) {

    console.error(error);

    return Response.json(

      {
        error:
          "Error exportando reporte",
      },

      {
        status: 500,
      }
    );
  }
}
