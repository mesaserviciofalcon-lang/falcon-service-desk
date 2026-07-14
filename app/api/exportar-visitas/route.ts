import { prisma } from "@/lib/prisma";

import * as XLSX
from "xlsx";

import { formatearFechaColombia }
from "@/lib/fecha";

export async function GET() {

  try {

    const visitas =
      await prisma.solicitud.findMany({

        where: {

          tipo:
            "VISITA DOMICILIARIA",
        },

        include: {

          visita: true,
        },

        orderBy: {

          fechaCreacion:
            "desc",
        },
      });

    const data =
      visitas.map((item: any) => ({

        ID:
          item.id,

        CANDIDATO:
          item.visita
            ?.nombreCandidato,

        CEDULA:
          item.visita
            ?.cedula,

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

        RESULTADO:
          item.visita
            ?.resultadoVisita,

        OBSERVACIONES:
          item.visita
            ?.observaciones,

        FECHA_CREACION:
          formatearFechaColombia(
            item.fechaCreacion
          ),

        FECHA_GESTION:
          item.fechaGestion

            ? formatearFechaColombia(
                item.fechaGestion
              )

            : "",
      }));

    const worksheet =
      XLSX.utils
        .json_to_sheet(data);

    const workbook =
      XLSX.utils
        .book_new();

    XLSX.utils.book_append_sheet(

      workbook,

      worksheet,

      "Visitas"
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
            "attachment; filename=visitas.xlsx",
        },
      }
    );

  } catch (error) {

    console.error(error);

    return Response.json(

      {
        error:
          "Error exportando Excel",
      },

      {
        status: 500,
      }
    );
  }
}
