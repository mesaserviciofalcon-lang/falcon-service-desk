import { prisma } from "@/lib/prisma";

import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { puedeConsultarVisitas }
from "@/lib/permisosVisitas";

import * as XLSX
from "xlsx";

import { formatearFechaColombia }
from "@/lib/fecha";

function resultadoHistorico(
  fechaVisitaRealizada?: string | null
) {
  const texto =
    String(
      fechaVisitaRealizada || ""
    ).trim();

  if (!texto) {
    return "";
  }

  if (
    texto
      .toUpperCase()
      .includes("CANCEL")
  ) {
    return texto;
  }

  return "Realizada";
}

export async function GET() {

  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (
      !puedeConsultarVisitas(
        session?.user?.cargo
      )
    ) {
      return Response.json(
        {
          error:
            "No tiene permiso para exportar visitas",
        },
        {
          status: 403,
        }
      );
    }

    const [
      visitas,
      visitasHistoricas,
    ] = await Promise.all([
      prisma.solicitud.findMany({

        where: {

          tipo:
            "VISITA DOMICILIARIA",
        },

        include: {

          visita: true,

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
      }),
      prisma.visitaHistorica.findMany({
        select: {
          id: true,
          fechaSolicitud: true,
          fechaSolicitudDate: true,
          correoSolicitante: true,
          solicitanteNombre: true,
          nombresApellidos: true,
          cedula: true,
          telefono: true,
          direccion: true,
          municipio: true,
          zona: true,
          motivoVisita: true,
          cargo: true,
          fincaEAI: true,
          fechaExpedicionCedula: true,
          fechaVisitaRealizada: true,
          fechaVisitaDate: true,
          origenArchivo: true,
        },
        orderBy: [
          {
            fechaVisitaDate: {
              sort: "desc",
              nulls: "last",
            },
          },
          {
            id: "desc",
          },
        ],
      }),
    ]);

    const data =
      [
        ...visitas.map((item: any) => ({

        ID:
          item.id,

        ORIGEN:
          "PLATAFORMA",

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

        RESULTADO:
          item.visita
            ?.resultadoVisita,

        OBSERVACIONES:
          item.visita
            ?.observaciones,

        OBSERVACION_TECNICA:
          item.gestiones?.[0]
            ?.observacion ||
          item.observacionesTecnico ||
          "",

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
        })),
        ...visitasHistoricas.map((item) => ({
          ID:
            item.id,

          ORIGEN:
            "HISTORICO",

          CANDIDATO:
            item.nombresApellidos,

          CEDULA:
            item.cedula,

          FECHA_EXPEDICION:
            item.fechaExpedicionCedula,

          TELEFONO:
            item.telefono,

          DIRECCION:
            item.direccion,

          MUNICIPIO:
            item.municipio,

          ZONA:
            item.zona,

          CARGO:
            item.cargo,

          FINCA:
            item.fincaEAI,

          MOTIVO:
            item.motivoVisita,

          ESTADO:
            "HISTORICO",

          RESULTADO:
            resultadoHistorico(
              item.fechaVisitaRealizada
            ),

          OBSERVACIONES:
            "",

          OBSERVACION_TECNICA:
            "",

          FECHA_CREACION:
            item.fechaSolicitudDate
              ? formatearFechaColombia(
                  item.fechaSolicitudDate
                )
              : item.fechaSolicitud ||
                "",

          FECHA_GESTION:
            item.fechaVisitaDate
              ? formatearFechaColombia(
                  item.fechaVisitaDate
                )
              : item.fechaVisitaRealizada ||
                "",

          SOLICITANTE:
            item.solicitanteNombre ||
            "",

          CORREO_SOLICITANTE:
            item.correoSolicitante ||
            "",

          ARCHIVO_ORIGEN:
            item.origenArchivo ||
            "",
        })),
      ];

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
