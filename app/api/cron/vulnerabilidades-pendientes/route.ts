import { enviarCorreo }
from "@/lib/email";

import { prisma }
from "@/lib/prisma";

import {
  obtenerCopiasVulnerabilidad,
  recordatorioVulnerabilidadesTemplate,
} from "@/lib/vulnerabilidades";

export const dynamic =
  "force-dynamic";
export const runtime =
  "nodejs";

function assertCronAuth(
  request: Request
) {
  const authHeader =
    request.headers.get(
      "authorization"
    );

  if (!process.env.CRON_SECRET) {
    return new Response(
      "CRON_SECRET no configurado",
      {
        status: 500,
      }
    );
  }

  if (
    authHeader !==
    `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response(
      "Unauthorized",
      {
        status: 401,
      }
    );
  }

  return null;
}

function claveGrupo(
  informe: {
    analistaSigCorreo: string | null;
    gerenteCorreo: string | null;
  }
) {
  return [
    informe.analistaSigCorreo || "",
    informe.gerenteCorreo || "",
  ].join("|");
}

export async function GET(
  request: Request
) {
  const authError =
    assertCronAuth(request);

  if (authError) {
    return authError;
  }

  try {
    const fechaLimite =
      new Date();

    fechaLimite.setDate(
      fechaLimite.getDate() - 8
    );

    const pendientes =
      await prisma
        .vulnerabilidadInforme
        .findMany({
          where: {
            estado: {
              not:
                "CERRADO",
            },
            fecha: {
              lte:
                fechaLimite,
            },
            analistaSigCorreo: {
              not:
                null,
            },
          },
          orderBy: [
            {
              analistaSigCorreo:
                "asc",
            },
            {
              eai:
                "asc",
            },
            {
              fecha:
                "asc",
            },
          ],
          select: {
            id: true,
            consecutivo: true,
            eai: true,
            fecha: true,
            actoInseguro: true,
            vulnerabilidad: true,
            supervisor: true,
            reportadoPor: true,
            analistaSigNombre: true,
            analistaSigCorreo: true,
            gerenteCorreo: true,
          },
        });

    const grupos =
      new Map<
        string,
        typeof pendientes
      >();

    for (const informe of pendientes) {
      const clave =
        claveGrupo(informe);

      grupos.set(clave, [
        ...(grupos.get(clave) || []),
        informe,
      ]);
    }

    const copiasBase =
      obtenerCopiasVulnerabilidad();
    let correosEnviados =
      0;

    for (const informes of grupos.values()) {
      const primero =
        informes[0];

      if (
        !primero?.analistaSigCorreo
      ) {
        continue;
      }

      const copias =
        Array.from(
          new Set([
            primero.gerenteCorreo,
            ...copiasBase,
          ].filter(Boolean))
        ) as string[];

      await enviarCorreo({
        to:
          primero.analistaSigCorreo,
        cc:
          copias.join(","),
        subject:
          `Recordatorio: ${informes.length} analisis de vulnerabilidad pendientes`,
        html:
          recordatorioVulnerabilidadesTemplate({
            analista:
              primero.analistaSigNombre,
            informes,
          }),
      });

      correosEnviados += 1;
    }

    return Response.json({
      ok: true,
      fechaLimite:
        fechaLimite.toISOString(),
      pendientes:
        pendientes.length,
      grupos:
        grupos.size,
      correosEnviados,
    });
  } catch (error) {
    console.error(
      "Error enviando recordatorio de vulnerabilidades:",
      error
    );

    return Response.json(
      {
        error:
          "No fue posible enviar el recordatorio de vulnerabilidades.",
      },
      {
        status: 500,
      }
    );
  }
}
