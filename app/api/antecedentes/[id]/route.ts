import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

import {
  puedeEditarConsultaAntecedentes,
} from "@/lib/antecedentesCatalogos";

import { obtenerFechaActualColombiaISO }
from "@/lib/fecha";

import {
  validarRegistroAntecedente,
} from "@/lib/validacionAntecedentesGestion";

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
    !puedeEditarConsultaAntecedentes(
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

    const revisadoPorSesion =
      session?.user?.role === "SUPERVISOR"
        ? (
            session.user.name ||
            session.user.email ||
            "Supervisor"
          ).trim()
        : null;

    const registroActualizado = {
      ...body,
      revisadoPor:
        revisadoPorSesion ||
        body.revisadoPor,
    };

    const errorValidacion =
      validarRegistroAntecedente(
        registroActualizado
      );

    if (errorValidacion) {
      return Response.json(
        {
          error:
            errorValidacion,
        },
        {
          status: 400,
        }
      );
    }

    const registro =
      await prisma.antecedenteRegistro.update({

        where: {
          id,
        },

        data: {
          fechaRespuesta:
            obtenerFechaActualColombiaISO(),
          observacion:
            registroActualizado.observacion || null,
          revisadoPor:
            registroActualizado.revisadoPor || null,
          motivo:
            registroActualizado.motivo || null,
          autorizacion:
            registroActualizado.autorizacion || null,
          observaciones:
            registroActualizado.observaciones || null,
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

export async function DELETE(
  _request: Request,
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
    !puedeEditarConsultaAntecedentes(
      session?.user?.role
    )
  ) {
    return Response.json(
      {
        error:
          "No tiene permiso para eliminar antecedentes",
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

    await prisma
      .antecedenteRegistro
      .delete({
        where: {
          id,
        },
      });

    return Response.json({
      ok: true,
    });
  } catch (error: any) {
    console.error(error);

    return Response.json(
      {
        error:
          error.message ||
          "Error eliminando antecedente",
      },
      {
        status: 500,
      }
    );
  }
}
