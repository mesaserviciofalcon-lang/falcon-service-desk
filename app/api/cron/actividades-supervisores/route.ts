import { enviarCorreo } from "@/lib/email";
import {
  inicioDiaColombia,
  incumplimientoActividadTemplate,
  mismaFincaActividad,
  normalizarCorreo,
  recordatorioActividadesAnalistaTemplate,
  recordatorioActividadesJefeTemplate,
  recordatorioActividadesSupervisorTemplate,
  recordatorioProgramacionActividadesTemplate,
  ventanaProgramacionAnalista,
} from "@/lib/actividadesSupervisores";
import { prisma } from "@/lib/prisma";
import { definicionSimulacro } from "@/lib/simulacros";

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
    const haceTresDias = new Date(hoy); haceTresDias.setUTCDate(haceTresDias.getUTCDate() - 3);
    const [paraRecordar, incumplidas, jefes, analistasSig, sacPendientes] = await Promise.all([
      prisma.actividadSupervisor.findMany({ where: { estado: "ASIGNADO", fechaPlaneada: { gte: manana, lt: pasadoManana }, recordatorioPrevioEnviadoAt: null, supervisorCorreo: { not: null } } }),
      prisma.actividadSupervisor.findMany({ where: { estado: { not: "TERMINADO" }, fechaPlaneada: { lt: hoy }, recordatorioIncumplimientoEnviadoAt: null } }),
      prisma.usuario.findMany({ where: { activo: true, cargo: "JEFE SEG" }, select: { email: true } }),
      prisma.usuario.findMany({ where: { activo: true, cargo: "ANALISTA SIG", fincaEAI: { not: null } }, select: { nombre: true, email: true, fincaEAI: true } }),
      prisma.simulacroActividad.findMany({ where: { requiereSac: true, solicitudAccion: null, createdAt: { lt: haceTresDias }, recordatorioSacEnviadoAt: null }, include: { actividadSupervisor: true } }),
    ]);
    let enviados = 0;
    const actividadesPorSupervisor = new Map<string, typeof paraRecordar>();
    for (const actividad of paraRecordar) {
      const correo = normalizarCorreo(actividad.supervisorCorreo);
      if (!correo) continue;
      const actividades = actividadesPorSupervisor.get(correo) || [];
      actividades.push(actividad);
      actividadesPorSupervisor.set(correo, actividades);
    }
    for (const [correo, actividades] of actividadesPorSupervisor) {
      await enviarCorreo({
        to: correo,
        subject: `Recordatorio: actividades programadas para mañana (${actividades.length})`,
        html: recordatorioActividadesSupervisorTemplate({ supervisor: actividades[0].supervisorNombre || "Supervisor", actividades }),
      });
      enviados += 1;
    }

    for (const analista of analistasSig) {
      const actividadesAnalista = paraRecordar.filter((actividad) => actividad.actividad !== "RECOGER EFECTIVO" && mismaFincaActividad(analista.fincaEAI, actividad.finca));
      if (!actividadesAnalista.length || !analista.email) continue;
      await enviarCorreo({
        to: analista.email,
        subject: `Aviso: visita de Seguridad programada para mañana - ${actividadesAnalista[0].finca}`,
        html: recordatorioActividadesAnalistaTemplate({ analista: analista.nombre, actividades: actividadesAnalista }),
      });
      enviados += 1;
    }

    const correosJefeProgramacion = jefes.map((jefe) => jefe.email).filter(Boolean).join(",");
    if (paraRecordar.length && correosJefeProgramacion) {
      await enviarCorreo({
        to: correosJefeProgramacion,
        subject: `Programación de supervisores para mañana (${paraRecordar.length} actividades)`,
        html: recordatorioActividadesJefeTemplate({ actividades: paraRecordar }),
      });
      enviados += 1;
    }

    if (paraRecordar.length) {
      await prisma.actividadSupervisor.updateMany({
        where: { id: { in: paraRecordar.map((actividad) => actividad.id) } },
        data: { recordatorioPrevioEnviadoAt: new Date() },
      });
    }

    const correosJefe = jefes.map((jefe) => jefe.email).filter(Boolean).join(",");
    for (const actividad of incumplidas) {
      if (!correosJefe) break;
      await enviarCorreo({ to: correosJefe, subject: `Actividad pendiente: ${actividad.actividad}`, html: incumplimientoActividadTemplate({ actividad }) });
      await prisma.actividadSupervisor.update({ where: { id: actividad.id }, data: { recordatorioIncumplimientoEnviadoAt: new Date() } });
      enviados += 1;
    }
    const correosJefatura = await prisma.usuario.findMany({ where: { activo: true, OR: [{ rol: { in: ["JEFE_SEG", "DIRECTOR_SEG"] } }, { cargo: { in: ["JEFE SEG", "DIRECTOR SEG"] } }] }, select: { email: true } });
    for (const simulacro of sacPendientes) {
      const contactos = definicionSimulacro(simulacro.tipo, simulacro.area, simulacro.finca);
      if (!contactos?.correoAnalista) continue;
      const copias = Array.from(new Set([contactos.gerente?.correo, ...correosJefatura.map((usuario) => usuario.email)].filter(Boolean))).join(",");
      await enviarCorreo({ to: contactos.correoAnalista, cc: copias || undefined, subject: `Recordatorio SAC pendiente - ${simulacro.finca}`, html: `<p>Han transcurrido más de tres días desde el simulacro <strong>${simulacro.tipo}</strong> con resultado no detectado.</p><p>Por favor diligencie la <a href="${process.env.NEXTAUTH_URL || "https://falconseguridad.com"}/solicitudes-accion/${simulacro.id}">Solicitud de Acción Correctiva</a>.</p>` });
      await prisma.simulacroActividad.update({ where: { id: simulacro.id }, data: { recordatorioSacEnviadoAt: new Date() } });
      enviados += 1;
    }
    let recordatoriosProgramacion = 0;
    const ventanaProgramacion = ventanaProgramacionAnalista(hoy);
    if (ventanaProgramacion.abierta) {
      const [actividadesProgramables, analistas] = await Promise.all([
        prisma.actividadSupervisor.findMany({ where: { estado: { not: "TERMINADO" }, actividad: { not: "RECOGER EFECTIVO" }, programadoPorAnalistaAt: null, fechaPlaneada: { gte: ventanaProgramacion.inicioMesDestino, lt: ventanaProgramacion.finMesDestino }, OR: [{ recordatorioProgramacionEnviadoAt: null }, { recordatorioProgramacionEnviadoAt: { lt: hoy } }] } }),
        prisma.usuario.findMany({ where: { activo: true, cargo: "ANALISTA SIG", fincaEAI: { not: null } }, select: { nombre: true, email: true, fincaEAI: true } }),
      ]);
      for (const analista of analistas) {
        const actividadesAnalista = actividadesProgramables.filter((actividad) => mismaFincaActividad(analista.fincaEAI, actividad.finca));
        if (!actividadesAnalista.length) continue;
        await enviarCorreo({ to: analista.email, subject: `Programación pendiente de actividades - ${ventanaProgramacion.etiquetaMes}`, html: recordatorioProgramacionActividadesTemplate({ analista: analista.nombre, actividades: actividadesAnalista, etiquetaMes: ventanaProgramacion.etiquetaMes, etiquetaVentana: ventanaProgramacion.etiquetaMesActual, etiquetaUltimoDiaVentana: ventanaProgramacion.etiquetaUltimoDiaVentana }) });
        await prisma.actividadSupervisor.updateMany({ where: { id: { in: actividadesAnalista.map((actividad) => actividad.id) } }, data: { recordatorioProgramacionEnviadoAt: new Date() } });
        recordatoriosProgramacion += 1;
        enviados += 1;
      }
    }
    return Response.json({ ok: true, recordatorios: paraRecordar.length, incumplidas: incumplidas.length, sacPendientes: sacPendientes.length, recordatoriosProgramacion, enviados });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "No fue posible enviar los recordatorios" }, { status: 500 });
  }
}
