import { getServerSession }
from "next-auth";

import * as XLSX
from "xlsx";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

import {
  puedeVerAntecedenteCompleto,
} from "@/lib/antecedentesCatalogos";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      solicitudId: string;
    }>;
  }
) {
  const session =
    await getServerSession(
      authOptions
    );

  if (!session?.user) {
    return Response.json(
      {
        error:
          "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const params =
      await context.params;

    const solicitudId =
      Number(params.solicitudId);

    const solicitud =
      await prisma.solicitud.findUnique({

        where: {
          id: solicitudId,
        },

        include: {
          antecedente: true,
          antecedentesRegistros: {
            orderBy: {
              id: "asc",
            },
          },
        },
      });

    if (!solicitud) {
      return Response.json(
        {
          error:
            "Solicitud no encontrada",
        },
        {
          status: 404,
        }
      );
    }

    const puedeVerCompleto =
      puedeVerAntecedenteCompleto(
        session.user.role
      );

    const mismaFinca =
      Boolean(
        session.user.fincaEAI &&
        solicitud.antecedente?.fincaEAI ===
          session.user.fincaEAI
      );

    const solicitudPropia =
      solicitud.correoSolicitante ===
      session.user.email;

    if (
      !puedeVerCompleto &&
      !mismaFinca &&
      !solicitudPropia
    ) {
      return Response.json(
        {
          error:
            "No tiene permiso para descargar este archivo",
        },
        {
          status: 403,
        }
      );
    }

    const data =
      solicitud.antecedentesRegistros.map(
        (registro) => {

          const base = {
            "FECHA DE SOLICITUD":
              registro.fechaSolicitud || "",
            "FECHA RESPUESTA":
              registro.fechaRespuesta || "",
            EAI:
              registro.eai || "",
            "NOMBRES Y APELLIDOS":
              registro.nombresApellidos || "",
            "TIPO DE DOCUMENTO":
              registro.tipoDocumento || "",
            IDENTIFICACION:
              registro.identificacion || "",
            "FECHA EXPEDICION DOCUMENTO":
              registro.fechaExpedicionDocumento || "",
            OBSERVACION:
              registro.observacion || "",
          };

          if (!puedeVerCompleto) {
            return base;
          }

          return {
            ...base,
            "REVISADO POR":
              registro.revisadoPor || "",
            MOTIVO:
              registro.motivo || "",
            AUTORIZACION:
              registro.autorizacion || "",
            OBSERVACIONES:
              registro.observaciones || "",
          };
        }
      );

    const worksheet =
      XLSX.utils.json_to_sheet(data);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Antecedentes"
    );

    const excelBuffer =
      XLSX.write(workbook, {
        bookType: "xlsx",
        type: "buffer",
      });

    return new Response(
      excelBuffer,
      {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition":
            `attachment; filename=antecedentes-${solicitud.id}.xlsx`,
        },
      }
    );

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          "Error exportando antecedentes",
      },
      {
        status: 500,
      }
    );
  }
}
