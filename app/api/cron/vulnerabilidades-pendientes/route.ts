import { enviarCorreo }
from "@/lib/email";

import { prisma }
from "@/lib/prisma";

import {
  obtenerCopiasVulnerabilidad,
  recordatorioVulnerabilidadesTemplate,
} from "@/lib/vulnerabilidades";

import {
  recordatorioTicketsPendientesTemplate,
} from "@/lib/templatesEmail";

import {
  obtenerTecnicoCctvPorEai,
} from "@/lib/cctvEjecucion";

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

function diasPendiente(
  fecha: Date,
  ahora: Date
) {
  return Math.max(
    1,
    Math.floor(
      (ahora.getTime() - fecha.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
}

function unirCorreos(
  correos: Array<string | null | undefined>
) {
  return Array.from(
    new Set(
      correos
        .flatMap((correo) =>
          String(correo || "").split(",")
        )
        .map((correo) => correo.trim())
        .filter(Boolean)
    )
  );
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
    const ahora = new Date();
    const fechaLimite =
      new Date(ahora);

    fechaLimite.setDate(
      fechaLimite.getDate() - 8
    );

    const fechaLimiteCctv =
      new Date(ahora);
    fechaLimiteCctv.setDate(
      fechaLimiteCctv.getDate() - 3
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

    const [usuariosRecordatorio, visitasPendientes, cctvPendientes, novedadesPendientes] =
      await Promise.all([
        prisma.usuario.findMany({
          where: {
            activo: true,
            cargo: {
              in: [
                "ANALISTA SEGURIDAD",
                "DIRECTOR SEG",
                "JEFE SEG",
                "ADMINISTRADOR MASTER",
              ],
            },
          },
          select: {
            nombre: true,
            email: true,
            cargo: true,
          },
        }),
        prisma.solicitud.findMany({
          where: {
            tipo: "VISITA DOMICILIARIA",
            estado: {
              notIn: [
                "COMPLETADO",
                "CERRADO",
              ],
            },
            fechaCreacion: {
              lte: fechaLimite,
            },
          },
          orderBy: {
            fechaCreacion: "asc",
          },
          select: {
            id: true,
            solicitante: true,
            estado: true,
            fechaCreacion: true,
            visita: {
              select: {
                fincaEAI: true,
              },
            },
          },
        }),
        prisma.solicitud.findMany({
          where: {
            tipo: "CCTV",
            estado: {
              notIn: [
                "COMPLETADO",
                "CERRADO",
              ],
            },
            fechaCreacion: {
              lte: fechaLimiteCctv,
            },
          },
          orderBy: {
            fechaCreacion: "asc",
          },
          select: {
            id: true,
            solicitante: true,
            estado: true,
            fechaCreacion: true,
            cctv: {
              select: {
                fincaEAI: true,
              },
            },
          },
        }),
        prisma.solicitud.findMany({
          where: {
            tipo: "NOVEDAD SEGURIDAD",
            estado: {
              notIn: [
                "COMPLETADO",
                "CERRADO",
              ],
            },
            fechaCreacion: {
              lte: fechaLimiteCctv,
            },
          },
          orderBy: {
            fechaCreacion: "asc",
          },
          select: {
            id: true,
            solicitante: true,
            estado: true,
            fechaCreacion: true,
            novedad: {
              select: {
                fincaEAI: true,
              },
            },
          },
        }),
      ]);

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

    const analistasSeguridad = unirCorreos(
      usuariosRecordatorio
        .filter(
          (usuario) =>
            usuario.cargo === "ANALISTA SEGURIDAD"
        )
        .map((usuario) => usuario.email)
    );
    const copiasVisitas = unirCorreos(
      usuariosRecordatorio
        .filter(
          (usuario) =>
            ["DIRECTOR SEG", "JEFE SEG"].includes(
              usuario.cargo || ""
            )
        )
        .map((usuario) => usuario.email)
    );
    const copiasCctv = unirCorreos(
      usuariosRecordatorio
        .filter(
          (usuario) =>
            [
              "DIRECTOR SEG",
              "JEFE SEG",
              "ADMINISTRADOR MASTER",
            ].includes(usuario.cargo || "")
        )
        .map((usuario) => usuario.email)
    );
    const jefesSeguridad = unirCorreos(
      usuariosRecordatorio
        .filter(
          (usuario) =>
            usuario.cargo === "JEFE SEG"
        )
        .map((usuario) => usuario.email)
    );
    const copiasNovedades = unirCorreos(
      usuariosRecordatorio
        .filter(
          (usuario) =>
            usuario.cargo === "DIRECTOR SEG"
        )
        .map((usuario) => usuario.email)
    );

    if (
      visitasPendientes.length > 0 &&
      analistasSeguridad.length > 0
    ) {
      await enviarCorreo({
        to: analistasSeguridad.join(","),
        cc: copiasVisitas.join(","),
        subject:
          `Recordatorio: ${visitasPendientes.length} visitas domiciliarias pendientes de cierre`,
        html:
          recordatorioTicketsPendientesTemplate({
            titulo:
              "Visitas domiciliarias pendientes de cierre",
            destinatario:
              "Analistas de Seguridad",
            tickets: visitasPendientes.map(
              (ticket) => ({
                ...ticket,
                eai: ticket.visita?.fincaEAI,
                diasPendiente: diasPendiente(
                  ticket.fechaCreacion,
                  ahora
                ),
              })
            ),
          }),
      });
      correosEnviados += 1;
    }

    if (
      novedadesPendientes.length > 0 &&
      jefesSeguridad.length > 0
    ) {
      await enviarCorreo({
        to: jefesSeguridad.join(","),
        cc: copiasNovedades.join(","),
        subject:
          `Recordatorio: ${novedadesPendientes.length} novedades de seguridad pendientes de cierre`,
        html:
          recordatorioTicketsPendientesTemplate({
            titulo:
              "Novedades de seguridad pendientes de cierre",
            destinatario:
              "Jefe de Seguridad",
            tickets: novedadesPendientes.map(
              (ticket) => ({
                ...ticket,
                eai: ticket.novedad?.fincaEAI,
                diasPendiente: diasPendiente(
                  ticket.fechaCreacion,
                  ahora
                ),
              })
            ),
            diasLimite: 3,
          }),
      });
      correosEnviados += 1;
    }

    const cctvPorTecnico = new Map<
      string,
      {
        nombre: string;
        correo: string;
        tickets: Array<{
          id: number;
          solicitante: string;
          estado: string;
          fechaCreacion: Date;
          eai?: string | null;
          diasPendiente: number;
        }>;
      }
    >();

    for (const ticket of cctvPendientes) {
      const tecnico = obtenerTecnicoCctvPorEai(
        ticket.cctv?.fincaEAI
      );

      if (!tecnico) {
        continue;
      }

      const grupo = cctvPorTecnico.get(
        tecnico.correo
      ) || {
        nombre: tecnico.nombre,
        correo: tecnico.correo,
        tickets: [],
      };

      grupo.tickets.push({
        ...ticket,
        eai: ticket.cctv?.fincaEAI,
        diasPendiente: diasPendiente(
          ticket.fechaCreacion,
          ahora
        ),
      });
      cctvPorTecnico.set(
        tecnico.correo,
        grupo
      );
    }

    for (const grupo of cctvPorTecnico.values()) {
      await enviarCorreo({
        to: grupo.correo,
        cc: copiasCctv.join(","),
        subject:
          `Recordatorio: ${grupo.tickets.length} tickets CCTV pendientes de cierre`,
        html:
          recordatorioTicketsPendientesTemplate({
            titulo:
              "Tickets CCTV pendientes de cierre",
            destinatario: grupo.nombre,
            tickets: grupo.tickets,
            diasLimite: 3,
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
      visitasPendientes:
        visitasPendientes.length,
      cctvPendientes:
        cctvPendientes.length,
      novedadesPendientes:
        novedadesPendientes.length,
      fechaLimiteCctv:
        fechaLimiteCctv.toISOString(),
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
