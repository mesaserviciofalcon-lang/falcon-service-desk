import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { normalizarCorreo } from "@/lib/actividadesSupervisores";
import { enviarCorreo } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { definicionSimulacro, desarrolloInicial, esActividadSimulacro, requiereSac } from "@/lib/simulacros";
import { generarPdfSimulacro } from "@/lib/simulacrosPdf";

function texto(valor: unknown) {
  return String(valor || "").trim();
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Debe iniciar sesión" }, { status: 401 });

  const { id } = await context.params;
  const actividad = await prisma.actividadSupervisor.findUnique({ where: { id: Number(id) } });
  if (!actividad || !esActividadSimulacro(actividad.actividad)) return Response.json({ error: "Actividad de simulacro no encontrada" }, { status: 404 });
  const esSupervisorAsignado = session.user.role === "SUPERVISOR" && normalizarCorreo(actividad.supervisorCorreo) === normalizarCorreo(session.user.email);
  if (!esSupervisorAsignado) return Response.json({ error: "Solo el supervisor asignado puede diligenciar el simulacro" }, { status: 403 });
  if (actividad.estado === "TERMINADO") return Response.json({ error: "La actividad ya está terminada" }, { status: 400 });

  try {
    const body = await request.json();
    const definicion = definicionSimulacro(actividad.actividad, actividad.area, actividad.finca);
    if (!definicion) return Response.json({ error: "Tipo de simulacro no configurado" }, { status: 400 });
    const horaInicio = texto(body.horaInicio);
    const resultado = texto(body.resultado).toUpperCase();
    const cumplimientoObjetivo = texto(body.cumplimientoObjetivo);
    const desarrollo = texto(body.desarrollo) || desarrolloInicial(horaInicio, definicion.guionInicial);
    const conclusion = texto(body.conclusion);
    const evidencias = Array.isArray(body.evidencias) ? body.evidencias : [];
    const aspectos = Array.isArray(body.aspectos) ? body.aspectos.map((aspecto: any) => ({ nombre: texto(aspecto.nombre), calificacion: Number(aspecto.calificacion) })) : [];
    const factoresFalla = Array.isArray(body.factoresFalla) ? body.factoresFalla.map(texto).filter(Boolean) : [];
    if (!horaInicio || !["DETECTADO", "NO DETECTADO"].includes(resultado) || !cumplimientoObjetivo || !conclusion || evidencias.length === 0 || aspectos.length === 0 || aspectos.some((aspecto: any) => !aspecto.nombre || ![1, 2, 3].includes(aspecto.calificacion))) {
      return Response.json({ error: "Complete el resultado, la evaluación, la conclusión y al menos una evidencia" }, { status: 400 });
    }

    const debeGenerarSac = requiereSac(resultado);
    const fechaEjecutada = new Date();
    const limiteCumplimiento = new Date(actividad.fechaPlaneada);
    limiteCumplimiento.setUTCHours(5, 0, 0, 0);
    limiteCumplimiento.setUTCDate(limiteCumplimiento.getUTCDate() + 1);
    const simulacro = await prisma.$transaction(async (tx) => {
      const creado = await tx.simulacroActividad.create({
        data: {
          actividadId: actividad.id, tipo: definicion.tipo, finca: actividad.finca, area: actividad.area,
          horaInicio, guion: definicion.guionInicial, resultado, cumplimientoObjetivo, desarrollo, aspectos,
          conclusion, controlVulnerado: texto(body.controlVulnerado) || null,
          razonIncumplimiento: texto(body.razonIncumplimiento) || null,
          factoresFalla, requiereSac: debeGenerarSac, evidencias,
          creadoPor: session.user.name || session.user.email || "Supervisor", creadoPorCorreo: session.user.email || "",
        },
      });
      await tx.actividadSupervisor.update({ where: { id: actividad.id }, data: {
        estado: "TERMINADO", fechaCierre: fechaEjecutada, cumplidaEnFecha: fechaEjecutada < limiteCumplimiento,
        cerradoPor: session.user.name || session.user.email, cerradoPorCorreo: session.user.email,
        observacionesCierre: `Simulacro registrado: ${resultado}`, evidencias,
      } });
      return creado;
    });

    const pdf = await generarPdfSimulacro({
      id: simulacro.id, tipo: definicion.tipo, finca: actividad.finca, area: actividad.area, fecha: fechaEjecutada,
      horaInicio, coordinador: session.user.name || session.user.email, analista: definicion.analista,
      objetivo: definicion.objetivo, riesgo: definicion.riesgo, controles: definicion.controles, guion: definicion.guionInicial,
      resultado, cumplimientoObjetivo, desarrollo, aspectos, conclusion, controlVulnerado: texto(body.controlVulnerado),
      razonIncumplimiento: texto(body.razonIncumplimiento), factoresFalla, requiereSac: debeGenerarSac,
    });
    const jefatura = await prisma.usuario.findMany({ where: { activo: true, rol: { in: ["JEFE_SEG", "DIRECTOR_SEG"] } }, select: { email: true } });
    const copias = Array.from(new Set([definicion.gerente?.correo, ...jefatura.map((usuario) => usuario.email)].filter(Boolean) as string[]));
    if (definicion.correoAnalista) {
      await enviarCorreo({
        to: definicion.correoAnalista,
        cc: copias.length ? copias.join(",") : undefined,
        subject: `Informe de ${definicion.tipo} - ${actividad.finca}`,
        html: `<p>Se adjunta el informe del simulacro realizado en la finca <strong>${actividad.finca}</strong>.</p>${debeGenerarSac ? `<p>El resultado fue <strong>NO DETECTADO</strong>. Debe diligenciar la <a href="${process.env.NEXTAUTH_URL || "https://falconseguridad.com"}/solicitudes-accion/${simulacro.id}">Solicitud de Acción (SAC)</a> en Falcon Service Desk.</p>` : ""}`,
        attachments: [{ filename: `simulacro-${actividad.finca}-${simulacro.id}.pdf`, content: pdf, contentType: "application/pdf" }],
      });
      await prisma.simulacroActividad.update({ where: { id: simulacro.id }, data: { notificadoAt: new Date() } });
    }
    return Response.json({ ok: true, simulacroId: simulacro.id, requiereSac: debeGenerarSac });
  } catch (error: any) {
    if (error?.code === "P2002") return Response.json({ error: "Este simulacro ya fue diligenciado" }, { status: 409 });
    console.error(error);
    return Response.json({ error: "No fue posible guardar el simulacro" }, { status: 500 });
  }
}
