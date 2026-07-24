import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

import {
  puedeVerAntecedenteCompleto,
} from "@/lib/antecedentesCatalogos";

import { obtenerFechaActualColombiaISO }
from "@/lib/fecha";

const OBSERVACION_NO_TENER_EN_CUENTA =
  "LA PERSONA NO DEBE SER TENIDA EN CUENTA";

function valorDiligenciado(
  valor: unknown
) {
  return (
    typeof valor === "string" &&
    valor.trim().length > 0
  );
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
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
          "No tiene permiso para gestionar antecedentes",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const params =
      await context.params;

    const id =
      Number(params.id);

    const body =
      await request.json();

    if (
      !valorDiligenciado(
        body.observacion
      )
    ) {
      return Response.json(
        {
          error:
            "Debe seleccionar una observacion",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !valorDiligenciado(
        body.revisadoPor
      )
    ) {
      return Response.json(
        {
          error:
            "Debe seleccionar quien reviso",
        },
        {
          status: 400,
        }
      );
    }

    if (
      body.observacion ===
      OBSERVACION_NO_TENER_EN_CUENTA
    ) {
      if (
        !valorDiligenciado(
          body.motivo
        )
      ) {
        return Response.json(
          {
            error:
              "Debe seleccionar un motivo",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !valorDiligenciado(
          body.observaciones
        )
      ) {
        return Response.json(
          {
            error:
              "Debe diligenciar observaciones",
          },
          {
            status: 400,
          }
        );
      }
    }

    const registro =
      await prisma.antecedenteRegistro.update({

        where: {
          id,
        },

        data: {
          fechaRespuesta:
            obtenerFechaActualColombiaISO(),
          eai:
            body.eai || null,
          tipoDocumento:
            body.tipoDocumento || null,
          observacion:
            body.observacion || null,
          revisadoPor:
            body.revisadoPor || null,
          motivo:
            body.motivo || null,
          autorizacion:
            body.autorizacion || null,
          observaciones:
            body.observaciones || null,
        },
      });

    return Response.json(
      registro
    );

  } catch (error: any) {
    console.error(error);

    return Response.json(
      {
        error:
          error.message ||
          "Error actualizando antecedente",
      },
      {
        status: 500,
      }
    );
  }
}
