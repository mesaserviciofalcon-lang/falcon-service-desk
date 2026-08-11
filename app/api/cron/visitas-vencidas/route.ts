import { enviarCorreo } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { ticketActualizadoTemplate } from "@/lib/templatesEmail";
import { correosResponsables } from "@/lib/correos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function assertCronAuth(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!process.env.CRON_SECRET) {
    return new Response("CRON_SECRET no configurado", {
      status: 500,
    });
  }

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  return null;
}

function unirCorreos(correos: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      correos
        .flatMap((correo) => String(correo || "").split(","))
        .map((correo) => correo.trim())
        .filter(Boolean)
    )
  );
}

export async function GET(request: Request) {
  const authError = assertCronAuth(request);

  if (authError) {
    return authError;
  }

  try {
    const ahora = new Date();
    const fechaLimite = new Date(ahora);
    fechaLimite.setMonth(fechaLimite.getMonth() - 1);

    const visitasVencidas = await prisma.solicitud.findMany({
      where: {
        tipo: "VISITA DOMICILIARIA",
        estado: "EN PROCESO",
        OR: [
          {
            fechaGestion: {
              lte: fechaLimite,
            },
          },
          {
            fechaGestion: null,
            fechaCreacion: {
              lte: fechaLimite,
            },
          },
        ],
      },
      orderBy: {
        fechaGestion: "asc",
      },
      select: {
        id: true,
        solicitante: true,
        correoSolicitante: true,
        fechaCreacion: true,
        fechaGestion: true,
        observacionesTecnico: true,
        gestionadoPor: true,
        visita: {
          select: {
            id: true,
            nombreCandidato: true,
            cedula: true,
            fincaEAI: true,
            observaciones: true,
            resultadoVisita: true,
          },
        },
        gestiones: {
          orderBy: {
            fecha: "desc",
          },
          take: 1,
          select: {
            usuario: true,
            observacion: true,
            fecha: true,
          },
        },
      },
    });

    let cerradas = 0;
    let correosEnviados = 0;
    const erroresCorreo: Array<{
      ticket: number;
      error: string;
    }> = [];

    for (const solicitud of visitasVencidas) {
      if (!solicitud.visita) {
        continue;
      }

      const ultimaGestion = solicitud.gestiones[0];
      const observacionAnalista =
        ultimaGestion?.observacion ||
        solicitud.observacionesTecnico ||
        solicitud.visita.observaciones ||
        "Sin observaciones registradas por la analista.";

      const observacionCierre = [
        "Cierre automatico por falta de informacion.",
        "La visita permanecio en proceso por mas de un mes y se marco como NO SE REALIZO.",
        "Por favor verificar las observaciones dejadas por la analista de seguridad que gestiono la visita.",
        `Observaciones de la analista: ${observacionAnalista}`,
      ].join(" ");

      const observacionesVisita = solicitud.visita.observaciones
        ? `${solicitud.visita.observaciones}\n\n${observacionCierre}`
        : observacionCierre;

      await prisma.$transaction([
        prisma.solicitud.update({
          where: {
            id: solicitud.id,
          },
          data: {
            estado: "COMPLETADO",
            fechaCierre: ahora,
            fechaGestion: ahora,
            gestionadoPor: "Cierre automatico del sistema",
            observacionesTecnico: observacionCierre,
          },
        }),
        prisma.solicitudVisita.update({
          where: {
            solicitudId: solicitud.id,
          },
          data: {
            resultadoVisita: "NO SE REALIZO",
            fechaRealizada: ahora,
            observaciones: observacionesVisita,
          },
        }),
        prisma.gestionTicket.create({
          data: {
            solicitudId: solicitud.id,
            usuario: "Cierre automatico del sistema",
            estado: "COMPLETADO",
            observacion: observacionCierre,
          },
        }),
      ]);

      cerradas += 1;

      const destinatarios = unirCorreos([
        solicitud.correoSolicitante,
        ...correosResponsables["VISITA DOMICILIARIA"],
      ]);

      if (destinatarios.length === 0) {
        continue;
      }

      try {
        await enviarCorreo({
          to: destinatarios.join(","),
          subject: `Ticket #${solicitud.id} cerrado automaticamente`,
          html: ticketActualizadoTemplate({
            ticket: solicitud.id,
            estado: "COMPLETADO - NO SE REALIZO",
            gestionadoPor: "Cierre automatico del sistema",
            observacion: observacionCierre,
          }),
        });

        correosEnviados += 1;
      } catch (error) {
        console.error(
          "Error enviando correo de cierre automatico de visita",
          {
            ticket: solicitud.id,
            error,
          }
        );

        erroresCorreo.push({
          ticket: solicitud.id,
          error:
            error instanceof Error
              ? error.message
              : "Error desconocido",
        });
      }
    }

    return Response.json({
      ok: true,
      fechaLimite: fechaLimite.toISOString(),
      evaluadas: visitasVencidas.length,
      cerradas,
      correosEnviados,
      erroresCorreo,
    });
  } catch (error) {
    console.error("Error cerrando visitas vencidas:", error);

    return Response.json(
      {
        error:
          "No fue posible cerrar automaticamente las visitas vencidas.",
      },
      {
        status: 500,
      }
    );
  }
}
