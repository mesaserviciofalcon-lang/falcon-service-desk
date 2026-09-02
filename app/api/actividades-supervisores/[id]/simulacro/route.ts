import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { normalizarCorreo } from "@/lib/actividadesSupervisores";
import { enviarCorreo } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { definicionSimulacro, desarrolloInicial, esActividadSimulacro, mismaFincaSimulacro, rangoAnoActualColombia, requiereSac } from "@/lib/simulacros";
import { getAppUrl } from "@/lib/appUrl";
import { esAnalistaSig } from "@/lib/permisosUsuarios";

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
    const usuariosInformados = await prisma.usuario.findMany({ where: { activo: true }, select: { nombre: true, email: true, cargo: true, rol: true, fincaEAI: true } });
    const analistaAsignado = usuariosInformados.find((usuario) => esAnalistaSig(usuario.cargo) && mismaFincaSimulacro(usuario.fincaEAI, actividad.finca));
    const personasInformadas = [`${analistaAsignado?.nombre || definicion.analista} - ANALISTA SIG`, ...usuariosInformados.filter((usuario) => ["JEFE_SEG", "DIRECTOR_SEG"].includes(usuario.rol) || ["JEFE SEG", "DIRECTOR SEG"].includes(String(usuario.cargo || ""))).map((usuario) => `${usuario.nombre} - ${usuario.cargo || usuario.rol}`)].join(" / ");
    const analista = analistaAsignado?.nombre || definicion.analista;
    const correoAnalista = analistaAsignado?.email || definicion.correoAnalista;
    const horaInicio = texto(body.horaInicio);
    const resultado = texto(body.resultado).toUpperCase();
    const cumplimientoObjetivo = texto(body.cumplimientoObjetivo);
    const duracionMinutos = Number(body.duracionMinutos);
    const pasos = Array.isArray(body.pasos) ? body.pasos.map((paso: any) => ({ descripcion: texto(paso.descripcion) })).filter((paso: any) => paso.descripcion) : [];
    const desarrollo = texto(body.desarrollo) || desarrolloInicial(horaInicio, definicion.guionInicial);
    const conclusion = texto(body.conclusion);
    const evidencias = Array.isArray(body.evidencias) ? body.evidencias : [];
    const aspectos = Array.isArray(body.aspectos) ? body.aspectos.map((aspecto: any) => ({ nombre: texto(aspecto.nombre), calificacion: Number(aspecto.calificacion) })) : [];
    const factoresFalla = Array.isArray(body.factoresFalla) ? body.factoresFalla.map(texto).filter(Boolean) : [];
    if (!horaInicio || !Number.isInteger(duracionMinutos) || duracionMinutos < 1 || pasos.length === 0 || !["DETECTADO", "NO DETECTADO"].includes(resultado) || !cumplimientoObjetivo || !conclusion || evidencias.length === 0 || aspectos.length === 0 || aspectos.some((aspecto: any) => !aspecto.nombre || ![1, 2, 3].includes(aspecto.calificacion))) {
      return Response.json({ error: "Complete el resultado, la evaluación, la conclusión y al menos una evidencia" }, { status: 400 });
    }

    const puntosPorCalificacion: Record<number, number> = { 3: 1, 2: 0.5, 1: 0 };
    const promedioEvaluacion = aspectos.reduce((total: number, aspecto: { calificacion: number }) => total + puntosPorCalificacion[aspecto.calificacion], 0) / aspectos.length;
    const debeGenerarSac = requiereSac(resultado) || promedioEvaluacion <= 0.5;
    const sacSugerida = debeGenerarSac ? `SAC sugerida: resultado ${resultado === "NO DETECTADO" ? "no detectado" : "con promedio de evaluación " + promedioEvaluacion.toFixed(2) + "/1"}. Conclusión reportada: ${conclusion}` : null;
    const fechaEjecutada = new Date();
    const limiteCumplimiento = new Date(actividad.fechaPlaneada);
    limiteCumplimiento.setUTCHours(5, 0, 0, 0);
    limiteCumplimiento.setUTCDate(limiteCumplimiento.getUTCDate() + 1);
    const simulacro = await prisma.$transaction(async (tx) => {
      const { ano, inicio, fin } = rangoAnoActualColombia(fechaEjecutada);
      const consecutivoNumero = await tx.simulacroActividad.count({ where: { finca: actividad.finca, createdAt: { gte: inicio, lt: fin } } }) + 1;
      const consecutivo = `SIM-${actividad.finca}-${ano}-${String(consecutivoNumero).padStart(3, "0")}`;
      const creado = await tx.simulacroActividad.create({
        data: {
          actividadId: actividad.id, tipo: definicion.tipo, finca: actividad.finca, area: actividad.area,
          horaInicio, duracionMinutos, consecutivo, grupoObjeto: texto(body.grupoObjeto) || null, personasInformadas, escenario: texto(body.escenario) || null, guion: definicion.guionInicial, resultado, cumplimientoObjetivo, desarrollo, pasos, aspectos, promedioEvaluacion, sacSugerida,
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
      if (resultado === "DETECTADO") {
        await tx.solicitudAccion.updateMany({ where: { actividadReprogramadaId: actividad.id, estado: "EN_SEGUIMIENTO" }, data: { estado: "CERRADA", seCierra: true, fechaCierre: fechaEjecutada, comentariosCierre: `Cierre automático: reprogramación ${consecutivo} ejecutada exitosamente.` } });
      }
      return creado;
    });

    const jefatura = await prisma.usuario.findMany({ where: { activo: true, OR: [{ rol: { in: ["JEFE_SEG", "DIRECTOR_SEG"] } }, { cargo: { in: ["JEFE SEG", "DIRECTOR SEG"] } }] }, select: { email: true } });
    const copias = Array.from(new Set([definicion.gerente?.correo, ...jefatura.map((usuario) => usuario.email)].filter(Boolean) as string[]));
    if (correoAnalista) {
      const fueDetectado = resultado === "DETECTADO";
      const resultadoDestacado = `<p style="margin:18px 0;padding:12px 16px;border-radius:6px;font-size:18px;font-weight:700;color:${fueDetectado ? "#166534" : "#b91c1c"};background:${fueDetectado ? "#dcfce7" : "#fee2e2"};">${fueDetectado ? "FUE DETECTADO" : "PERDIDO"}</p>`;
      const enlaceSac = `${getAppUrl()}/solicitudes-accion/${simulacro.id}`;
      await enviarCorreo({
        to: correoAnalista,
        cc: copias.length ? copias.join(",") : undefined,
        subject: `Informe de ${definicion.tipo} - ${actividad.finca}`,
        html: `<p>Se registró el informe <strong>${simulacro.consecutivo}</strong> del simulacro realizado en la finca <strong>${actividad.finca}</strong>.</p>${resultadoDestacado}<ul><li><strong>Simulacro:</strong> ${definicion.tipo}</li><li><strong>Área:</strong> ${actividad.area || "No registrada"}</li><li><strong>Fecha de ejecución:</strong> ${fechaEjecutada.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}</li><li><strong>Supervisor:</strong> ${session.user.name || session.user.email}</li><li><strong>Evaluación:</strong> ${promedioEvaluacion.toFixed(2)} / 1 (${Math.round(promedioEvaluacion * 100)}%)</li></ul><p>El informe queda disponible en Falcon Service Desk.</p>${debeGenerarSac ? `<p><strong>Debe ingresar al aplicativo para realizar la Solicitud de Acción Correctiva (SAC). Cuenta con tres (3) días para efectuar el cierre.</strong></p><p><a href="${enlaceSac}">Crear Solicitud de Acción Correctiva</a></p>` : ""}`,
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
