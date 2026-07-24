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
          "No tiene permiso para gestionar antecedentes",
      },
      {
        status: 403,
      }
    );
  }

  try {
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
            id: {
              in: ids,
            },
            solicitud: {
              tipo:
                "ANTECEDENTES",
              estado: {
                in: [
                  "Pendiente",
                  "EN PROCESO",
                  "REABIERTO",
                ],
              },
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
            "Hay registros que no pertenecen a tickets abiertos de antecedentes",
        },
        {
          status: 400,
        }
      );
    }

    const fechaRespuesta =
      obtenerFechaActualColombiaISO();

    await prisma.$transaction(
      registros.map((registro: any) =>
        prisma.antecedenteRegistro.update({
          where: {
            id: registro.id,
          },
          data: {
            fechaRespuesta,
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

    return Response.json({
      ok: true,
      actualizados:
        registros.length,
      fechaRespuesta,
    });

  } catch (error: any) {
    console.error(error);

    return Response.json(
      {
        error:
          error.message ||
          "Error guardando gestion masiva",
      },
      {
        status: 500,
      }
    );
  }
}
