import { enviarCorreo } from "@/lib/email";
import { inicioDiaColombia, incumplimientoActividadTemplate, recordatorioActividadTemplate } from "@/lib/actividadesSupervisores";
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
    const manana = new Date(hoy); manana.setUTCDate(manana.getUTCDate() + 1);
    const pasadoManana = new Date(manana); pasadoManana.setUTCDate(pasadoManana.getUTCDate() + 1);
    const [paraRecordar, incumplidas, jefes] = await Promise.all([
      prisma.actividadSupervisor.findMany({ where: { estado: "ASIGNADO", fechaPlaneada: { gte: manana, lt: pasadoManana }, recordatorioPrevioEnviadoAt: null, supervisorCorreo: { not: null } } }),
      prisma.actividadSupervisor.findMany({ where: { estado: { not: "TERMINADO" }, fechaPlaneada: { lt: hoy }, recordatorioIncumplimientoEnviadoAt: null } }),
      prisma.usuario.findMany({ where: { activo: true, cargo: "JEFE SEG" }, select: { email: true } }),
    ]);
    let enviados = 0;
    for (const actividad of paraRecordar) {
      if (!actividad.supervisorCorreo) continue;
      await enviarCorreo({ to: actividad.supervisorCorreo, subject: `Recordatorio: ${actividad.actividad} programada para mañana`, html: recordatorioActividadTemplate({ actividad }) });
      await prisma.actividadSupervisor.update({ where: { id: actividad.id }, data: { recordatorioPrevioEnviadoAt: new Date() } });
      enviados += 1;
    }
    const correosJefe = jefes.map((jefe) => jefe.email).filter(Boolean).join(",");
    for (const actividad of incumplidas) {
      if (!correosJefe) break;
      await enviarCorreo({ to: correosJefe, subject: `Actividad pendiente: ${actividad.actividad}`, html: incumplimientoActividadTemplate({ actividad }) });
      await prisma.actividadSupervisor.update({ where: { id: actividad.id }, data: { recordatorioIncumplimientoEnviadoAt: new Date() } });
      enviados += 1;
    }
    return Response.json({ ok: true, recordatorios: paraRecordar.length, incumplidas: incumplidas.length, enviados });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "No fue posible enviar los recordatorios" }, { status: 500 });
  }
}
