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
  esObservacionDocumentoNoCorresponde,
  validarRegistroAntecedente,
} from "@/lib/validacionAntecedentesGestion";

import { obtenerFechaActualColombiaISO }
from "@/lib/fecha";

function textoPlano(valor: unknown) {
  return String(valor || "").trim();
}

function normalizarIdentificacion(
  valor: unknown
) {
  return textoPlano(valor).replace(
    /\D/g,
    ""
  );
}

function normalizarFechaDocumento(
  valor: unknown
) {
  const texto =
    textoPlano(valor);

  const partesIso =
    texto.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

  if (partesIso) {
    return `${partesIso[1]}-${partesIso[2].padStart(2, "0")}-${partesIso[3].padStart(2, "0")}`;
  }

  const partesLocal =
    texto.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

  if (partesLocal) {
    return `${partesLocal[3]}-${partesLocal[2].padStart(2, "0")}-${partesLocal[1].padStart(2, "0")}`;
  }

  return texto;
}

type RegistroPreparado = {
  registro: any;
  solicitudId: number;
  nuevaIdentificacion: string;
  nuevaFechaExpedicion: string | null;
  cambioDocumento: boolean;
};

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
        .findMany({
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
          select: {
            id: true,
            solicitudId: true,
            identificacion: true,
            fechaExpedicionDocumento: true,
            observacion: true,
          },
        });

    if (
      registrosExistentes.length !==
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

    const existentesPorId =
      new Map(
        registrosExistentes.map(
          (registro) => [
            registro.id,
            registro,
          ]
        )
      );

    const registrosPreparados: RegistroPreparado[] =
      registros.map((registro: any) => {
        const existente =
          existentesPorId.get(
            registro.id
          );

        if (!existente) {
          throw new Error(
            "Hay registros que no pertenecen a tickets abiertos de antecedentes"
          );
        }

        const nuevaIdentificacion =
          normalizarIdentificacion(
            registro.identificacion
          ) ||
          existente.identificacion;

        const nuevaFechaExpedicion =
          normalizarFechaDocumento(
            registro.fechaExpedicionDocumento
          ) ||
          existente.fechaExpedicionDocumento ||
          null;

        const cambioDocumento =
          nuevaIdentificacion !==
            existente.identificacion ||
          nuevaFechaExpedicion !==
            (existente.fechaExpedicionDocumento ||
              null);

        const puedeCorregirDocumento =
          esObservacionDocumentoNoCorresponde(
            registro.observacion
          ) ||
          esObservacionDocumentoNoCorresponde(
            existente.observacion
          );

        if (
          cambioDocumento &&
          !puedeCorregirDocumento
        ) {
          throw new Error(
            "Solo se puede modificar identificacion o fecha de expedicion cuando la observacion sea NO COINCIDEN DATOS DEL DOCUMENTO"
          );
        }

        if (
          cambioDocumento &&
          (!nuevaIdentificacion ||
            !nuevaFechaExpedicion)
        ) {
          throw new Error(
            "La correccion documental debe tener identificacion y fecha de expedicion"
          );
        }

        return {
          registro,
          solicitudId:
            existente.solicitudId,
          nuevaIdentificacion,
          nuevaFechaExpedicion,
          cambioDocumento,
        };
      });

    const documentosPorTicket =
      new Map<number, Set<string>>();

    for (const preparado of registrosPreparados) {
      const documentos =
        documentosPorTicket.get(
          preparado.solicitudId
        ) || new Set<string>();

      if (
        documentos.has(
          preparado.nuevaIdentificacion
        )
      ) {
        return Response.json(
          {
            error:
              `La identificacion ${preparado.nuevaIdentificacion} queda duplicada en el ticket #${preparado.solicitudId}. Ajuste el documento antes de guardar.`,
          },
          {
            status: 400,
          }
        );
      }

      documentos.add(
        preparado.nuevaIdentificacion
      );
      documentosPorTicket.set(
        preparado.solicitudId,
        documentos
      );
    }

    const fechaRespuesta =
      obtenerFechaActualColombiaISO();

    await prisma.$transaction(
      registrosPreparados.map((preparado: RegistroPreparado) =>
        prisma.antecedenteRegistro.update({
          where: {
            id: preparado.registro.id,
          },
          data: {
            fechaRespuesta,
            identificacion:
              preparado.nuevaIdentificacion,
            fechaExpedicionDocumento:
              preparado.nuevaFechaExpedicion,
            observacion:
              preparado.cambioDocumento
                ? null
                : preparado.registro.observacion ||
              null,
            revisadoPor:
              preparado.cambioDocumento
                ? null
                : preparado.registro.revisadoPor ||
              null,
            motivo:
              preparado.cambioDocumento
                ? null
                : preparado.registro.motivo || null,
            autorizacion:
              preparado.cambioDocumento
                ? null
                : preparado.registro.autorizacion ||
              null,
            observaciones:
              preparado.cambioDocumento
                ? null
                : preparado.registro.observaciones ||
              null,
            tusdatosBatchId:
              preparado.cambioDocumento
                ? null
                : undefined,
            tusdatosJobId:
              preparado.cambioDocumento
                ? null
                : undefined,
            tusdatosBatchNumber:
              preparado.cambioDocumento
                ? null
                : undefined,
            tusdatosEstado:
              preparado.cambioDocumento
                ? null
                : undefined,
            tusdatosEnviadoAt:
              preparado.cambioDocumento
                ? null
                : undefined,
          },
        })
      )
    );

    const solicitudesCorregidas =
      Array.from(
        new Set(
          registrosPreparados
            .filter(
              (registro: RegistroPreparado) =>
                registro.cambioDocumento
            )
            .map(
              (registro: RegistroPreparado) =>
                registro.solicitudId
            )
        )
      );

    if (solicitudesCorregidas.length > 0) {
      await prisma.gestionTicket.createMany({
        data: solicitudesCorregidas.map(
          (solicitudId) => ({
            solicitudId,
            usuario:
              session?.user?.name ||
              session?.user?.email ||
              "Supervisor",
            estado:
              "REABIERTO",
            observacion:
              "Se corrigio informacion documental y quedo disponible para nueva consulta en TusDatos.",
          })
        ),
      });
    }

    const actualizados =
      await prisma
        .antecedenteRegistro
        .findMany({
          where: {
            id: {
              in: ids,
            },
          },
        });

    return Response.json({
      ok: true,
      actualizados:
        registros.length,
      fechaRespuesta,
      registros:
        actualizados,
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
