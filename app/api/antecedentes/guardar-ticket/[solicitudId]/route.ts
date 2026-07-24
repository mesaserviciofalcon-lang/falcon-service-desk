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
  validarRegistroAntecedente,
} from "@/lib/validacionAntecedentesGestion";

import { obtenerFechaActualColombiaISO }
from "@/lib/fecha";

export async function PATCH(
  request: Request,
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

    const solicitudId =
      Number(params.solicitudId);

    const body =
      await request.json();

    const registros =
      Array.isArray(body.registros)
        ? body.registros
        : [];

    if (registros.length === 0) {
      return Response.json(
        {
          error:
            "No hay registros para guardar",
        },
        {
          status: 400,
        }
      );
    }

    for (const registro of registros) {
      const errorValidacion =
        validarRegistroAntecedente(
          registro
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
    }

    const ids =
      registros.map(
        (registro: any) => registro.id
      );

    const registrosExistentes =
      await prisma
        .antecedenteRegistro
        .count({
          where: {
            solicitudId,
            id: {
              in: ids,
            },
          },
        });

    if (
      registrosExistentes !==
      registros.length
    ) {
      return Response.json(
        {
          error:
            "Hay registros que no pertenecen a este ticket",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.$transaction(
      registros.map((registro: any) =>
        prisma.antecedenteRegistro.update({
          where: {
            id: registro.id,
          },
          data: {
            fechaRespuesta:
              obtenerFechaActualColombiaISO(),
            eai:
              registro.eai || null,
            tipoDocumento:
              registro.tipoDocumento ||
              null,
            observacion:
              registro.observacion ||
              null,
            revisadoPor:
              registro.revisadoPor ||
              null,
            motivo:
              registro.motivo || null,
            autorizacion:
              registro.autorizacion ||
              null,
            observaciones:
              registro.observaciones ||
              null,
          },
        })
      )
    );

    const actualizados =
      await prisma
        .antecedenteRegistro
        .findMany({
          where: {
            solicitudId,
          },
          orderBy: {
            id: "asc",
          },
        });

    return Response.json({
      registros:
        actualizados,
    });

  } catch (error: any) {
    console.error(error);

    return Response.json(
      {
        error:
          error.message ||
          "Error guardando antecedentes",
      },
      {
        status: 500,
      }
    );
  }
}
