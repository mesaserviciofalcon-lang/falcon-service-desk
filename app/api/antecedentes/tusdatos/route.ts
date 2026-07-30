import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

import {
  puedeVerAntecedenteCompleto,
} from "@/lib/antecedentesCatalogos";

const DOCUMENTOS_PERMITIDOS =
  new Set([
    "CC",
    "CE",
    "PP",
    "PPT",
  ]);

function normalizarFechaTusdatos(
  valor?: string | null
) {
  if (!valor) {
    return "";
  }

  const texto =
    valor.trim();

  const formatoISO =
    texto.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

  if (formatoISO) {
    return `${formatoISO[3].padStart(2, "0")}/${formatoISO[2].padStart(2, "0")}/${formatoISO[1]}`;
  }

  const formatoLocal =
    texto.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

  if (formatoLocal) {
    return `${formatoLocal[1].padStart(2, "0")}/${formatoLocal[2].padStart(2, "0")}/${formatoLocal[3]}`;
  }

  const fecha =
    new Date(texto);

  if (
    !Number.isNaN(
      fecha.getTime()
    )
  ) {
    return fecha.toLocaleDateString(
      "es-CO",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone:
          "America/Bogota",
      }
    );
  }

  return texto;
}

function obtenerAutorizacionTusdatos() {
  const token =
    process.env.TUSDATOS_API_TOKEN ||
    process.env.TUSDATOS_CLIENT_ID;

  if (token) {
    return `Bearer ${token}`;
  }

  const usuario =
    process.env.TUSDATOS_USER;
  const clave =
    process.env.TUSDATOS_PASSWORD;

  if (usuario && clave) {
    return `Basic ${Buffer.from(
      `${usuario}:${clave}`
    ).toString("base64")}`;
  }

  return null;
}

export async function POST(
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
          "No tiene permiso para enviar consultas a Tusdatos",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const body =
      await request.json();

    const ids =
      Array.isArray(body.ids)
        ? body.ids
            .map((id: any) =>
              Number(id)
            )
            .filter((id: number) =>
              Number.isInteger(id)
            )
        : [];

    if (ids.length === 0) {
      return Response.json(
        {
          error:
            "Debe seleccionar al menos un registro para enviar a Tusdatos",
        },
        {
          status: 400,
        }
      );
    }

    if (ids.length > 2000) {
      return Response.json(
        {
          error:
            "Tusdatos permite maximo 2000 registros por lote",
        },
        {
          status: 400,
        }
      );
    }

    const autorizacion =
      obtenerAutorizacionTusdatos();

    if (!autorizacion) {
      return Response.json(
        {
          error:
            "Falta configurar TUSDATOS_API_TOKEN en las variables de entorno",
        },
        {
          status: 500,
        }
      );
    }

    const registros =
      await prisma
        .antecedenteRegistro
        .findMany({
          where: {
            id: {
              in: ids,
            },
            OR: [
              {
                observacion:
                  null,
              },
              {
                observacion:
                  "",
              },
            ],
            tusdatosBatchId: null,
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
            identificacion: true,
            tipoDocumento: true,
            fechaExpedicionDocumento: true,
          },
        });

    if (registros.length === 0) {
      return Response.json(
        {
          error:
            "No hay registros pendientes nuevos para enviar a Tusdatos",
        },
        {
          status: 400,
        }
      );
    }

    const combinaciones =
      new Set<string>();

    const checks =
      registros.map((registro) => {
        const typedoc =
          registro.tipoDocumento?.trim().toUpperCase() ||
          "";
        const doc =
          registro.identificacion?.trim() ||
          "";
        const expeditionDate =
          normalizarFechaTusdatos(
            registro.fechaExpedicionDocumento
          );

        if (
          !doc ||
          !typedoc ||
          !expeditionDate
        ) {
          throw new Error(
            `El registro ${registro.id} tiene datos incompletos para Tusdatos`
          );
        }

        if (
          !DOCUMENTOS_PERMITIDOS.has(
            typedoc
          )
        ) {
          throw new Error(
            `El tipo de documento ${typedoc} no esta permitido para Tusdatos`
          );
        }

        if (
          !/^\d+$/.test(doc)
        ) {
          throw new Error(
            `La identificacion ${doc} solo debe contener numeros`
          );
        }

        const llave =
          `${typedoc}:${doc}`;

        if (
          combinaciones.has(
            llave
          )
        ) {
          throw new Error(
            `La identificacion ${doc} esta duplicada en el lote`
          );
        }

        combinaciones.add(llave);

        return {
          typedoc,
          doc,
          expedition_date:
            expeditionDate,
        };
      });

    const baseUrl =
      process.env.TUSDATOS_BASE_URL ||
      "https://dash-board.tusdatos.co";
    const country =
      process.env.TUSDATOS_COUNTRY ||
      "CO";

    const response =
      await fetch(
        `${baseUrl.replace(/\/$/, "")}/api/v1/batches/launch?country=${encodeURIComponent(country)}`,
        {
          method: "POST",
          headers: {
            Authorization:
              autorizacion,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            checks,
            legal_representative:
              [],
            vehicles: [],
          }),
        }
      );

    const text =
      await response.text();

    let data: any = null;

    if (text) {
      try {
        data =
          JSON.parse(text);
      } catch {
        data = {
          message: text,
        };
      }
    }

    if (!response.ok) {
      return Response.json(
        {
          error:
            data?.message ||
            "Tusdatos rechazo la consulta",
          detalle:
            data,
        },
        {
          status:
            response.status,
        }
      );
    }

    const batchId =
      data?.data?.batch_id ||
      data?.batch_id ||
      "ENVIADO-SIN-BATCH";
    const jobId =
      data?.data?.job_id ||
      null;
    const batchNumber =
      Number.isInteger(
        data?.data?.batch_number
      )
        ? data.data.batch_number
        : null;
    const jobStatus =
      data?.data?.job_status ||
      "ENVIADO";

    await prisma
      .antecedenteRegistro
      .updateMany({
        where: {
          id: {
            in: registros.map(
              (registro) =>
                registro.id
            ),
          },
        },
        data: {
          tusdatosBatchId:
            batchId,
          tusdatosJobId:
            jobId,
          tusdatosBatchNumber:
            batchNumber,
          tusdatosEstado:
            jobStatus,
          tusdatosEnviadoAt:
            new Date(),
        },
      });

    return Response.json({
      ok: true,
      enviados:
        registros.length,
      omitidos:
        ids.length -
        registros.length,
      batchId,
      jobId,
      batchNumber,
      jobStatus,
    });

  } catch (error: any) {
    console.error(error);

    return Response.json(
      {
        error:
          error.message ||
          "Error enviando consulta a Tusdatos",
      },
      {
        status: 500,
      }
    );
  }
}
