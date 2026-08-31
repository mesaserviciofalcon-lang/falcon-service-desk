import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

import {
  puedeEditarAntecedenteSinRestriccion,
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
  observacion: string | null;
  revisadoPor: string | null;
  motivo: string | null;
  autorizacion: string | null;
  observaciones: string | null;
  nuevaIdentificacion: string;
  nuevaFechaExpedicion: string | null;
  cambioDocumento: boolean;
};

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

    const edicionSinRestriccion =
      puedeEditarAntecedenteSinRestriccion(
        session?.user?.role
      );

    const revisadoPorSesion =
      session?.user?.role === "SUPERVISOR"
        ? (
            session.user.name ||
            session.user.email ||
            "Supervisor"
          ).trim()
        : null;

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
          {
            ...registro,
            revisadoPor:
              revisadoPorSesion ||
              registro.revisadoPor,
          }
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
            solicitudId,
            id: {
              in: ids,
            },
          },
          select: {
            id: true,
            solicitudId: true,
            identificacion: true,
            fechaExpedicionDocumento: true,
            observacion: true,
            revisadoPor: true,
            motivo: true,
            autorizacion: true,
            observaciones: true,
            solicitud: {
              select: {
                estado: true,
              },
            },
          },
        });

    if (
      registrosExistentes.length !==
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
            "Hay registros que no pertenecen a este ticket"
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

        const ticketReabierto =
          String(
            existente.solicitud.estado || ""
          )
            .trim()
            .toUpperCase() === "REABIERTO";

        const filaPendienteGestion =
          !String(
            existente.observacion || ""
          ).trim();

        const restringirFila =
          ticketReabierto &&
          !edicionSinRestriccion &&
          !filaPendienteGestion &&
          !puedeCorregirDocumento;

        if (
          cambioDocumento &&
          !puedeCorregirDocumento
        ) {
          throw new Error(
            `Solo se puede modificar identificacion o fecha de expedicion cuando la observacion sea NO COINCIDEN DATOS DEL DOCUMENTO`
          );
        }

        if (
          cambioDocumento &&
          (!nuevaIdentificacion ||
            !nuevaFechaExpedicion)
        ) {
          throw new Error(
            `La correccion documental debe tener identificacion y fecha de expedicion`
          );
        }

        return {
          registro,
          observacion:
            restringirFila
              ? existente.observacion
              : registro.observacion || null,
          revisadoPor:
            restringirFila
              ? existente.revisadoPor
              : revisadoPorSesion ||
                registro.revisadoPor || null,
          motivo:
            restringirFila
              ? existente.motivo
              : registro.motivo || null,
          autorizacion:
            restringirFila
              ? existente.autorizacion
              : registro.autorizacion || null,
          observaciones:
            restringirFila
              ? existente.observaciones
              : registro.observaciones || null,
          nuevaIdentificacion,
          nuevaFechaExpedicion,
          cambioDocumento,
        };
      });

    const documentos =
      new Set<string>();

    for (const preparado of registrosPreparados) {
      const llave =
        preparado.nuevaIdentificacion;

      if (documentos.has(llave)) {
        return Response.json(
          {
            error:
              `La identificacion ${llave} queda duplicada en el ticket. Ajuste el documento antes de guardar.`,
          },
          {
            status: 400,
          }
        );
      }

      documentos.add(llave);
    }

    await prisma.$transaction(
      registrosPreparados.map((preparado: RegistroPreparado) =>
        prisma.antecedenteRegistro.update({
          where: {
            id: preparado.registro.id,
          },
          data: {
            fechaRespuesta:
              obtenerFechaActualColombiaISO(),
            identificacion:
              preparado.nuevaIdentificacion,
            fechaExpedicionDocumento:
              preparado.nuevaFechaExpedicion,
            observacion:
              preparado.cambioDocumento
                ? null
                : preparado.observacion,
            revisadoPor:
              preparado.cambioDocumento
                ? null
                : preparado.revisadoPor,
            motivo:
              preparado.cambioDocumento
                ? null
                : preparado.motivo,
            autorizacion:
              preparado.cambioDocumento
                ? null
                : preparado.autorizacion,
            observaciones:
              preparado.cambioDocumento
                ? null
                : preparado.observaciones,
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

    if (
      registrosPreparados.some(
        (registro: RegistroPreparado) =>
          registro.cambioDocumento
      )
    ) {
      await prisma.gestionTicket.create({
        data: {
          solicitudId,
          usuario:
            session?.user?.name ||
            session?.user?.email ||
            "Supervisor",
          estado:
            "REABIERTO",
          observacion:
            "Se corrigio informacion documental y quedo disponible para nueva consulta en TusDatos.",
        },
      });
    }

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
