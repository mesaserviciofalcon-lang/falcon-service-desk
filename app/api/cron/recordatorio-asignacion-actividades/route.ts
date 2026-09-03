import { enviarCorreo } from "@/lib/email";
import {
  inicioDiaColombia,
  normalizarCorreo,
  recordatorioAsignacionActividadesJefeTemplate,
} from "@/lib/actividadesSupervisores";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function autorizado(request: Request) {
  return Boolean(process.env.CRON_SECRET) && request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!autorizado(request)) return new Response("Unauthorized", { status: 401 });

  try {
    const hoy = inicioDiaColombia(new Date());
    const inicioMes = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1, 5));
    const inicioMesSiguiente = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 1, 5));
    const etiquetaMes = new Intl.DateTimeFormat("es-CO", {
      timeZone: "America/Bogota",
      month: "long",
      year: "numeric",
    }).format(hoy);

    const [actividadesPendientes, totalMes, jefes] = await Promise.all([
      prisma.actividadSupervisor.findMany({
        where: {
          estado: "PENDIENTE_ASIGNAR",
          fechaPlaneada: { gte: inicioMes, lt: inicioMesSiguiente },
        },
        orderBy: { fechaPlaneada: "asc" },
        select: {
          id: true,
          actividad: true,
          finca: true,
          area: true,
          fechaPlaneada: true,
          supervisorNombre: true,
        },
      }),
      prisma.actividadSupervisor.count({
        where: { fechaPlaneada: { gte: inicioMes, lt: inicioMesSiguiente } },
      }),
      prisma.usuario.findMany({
        where: {
          activo: true,
          OR: [{ rol: "JEFE_SEG" }, { cargo: "JEFE SEG" }],
        },
        select: { email: true },
      }),
    ]);

    if (!actividadesPendientes.length) {
      return Response.json({ ok: true, recordatorioEnviado: false, motivo: "Todas las actividades del mes están asignadas" });
    }

    const correosJefe = Array.from(new Set(jefes.map((jefe) => normalizarCorreo(jefe.email)).filter(Boolean)));
    if (!correosJefe.length) {
      return Response.json({ ok: true, recordatorioEnviado: false, motivo: "No hay Jefe SEG activo configurado" });
    }

    await enviarCorreo({
      to: correosJefe.join(","),
      subject: `Asignación pendiente de actividades - ${etiquetaMes} (${actividadesPendientes.length})`,
      html: recordatorioAsignacionActividadesJefeTemplate({
        actividades: actividadesPendientes,
        etiquetaMes,
        totalMes,
      }),
    });

    return Response.json({
      ok: true,
      recordatorioEnviado: true,
      pendientes: actividadesPendientes.length,
      totalMes,
      destinatarios: correosJefe.length,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "No fue posible enviar el recordatorio de asignación" }, { status: 500 });
  }
}
