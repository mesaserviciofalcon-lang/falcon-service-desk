import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

import {
  puedeVerAntecedenteCompleto,
} from "@/lib/antecedentesCatalogos";

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

    const registro =
      await prisma.antecedenteRegistro.update({

        where: {
          id,
        },

        data: {
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

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          "Error actualizando antecedente",
      },
      {
        status: 500,
      }
    );
  }
}
