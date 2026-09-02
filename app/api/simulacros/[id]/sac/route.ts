import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAppUrl } from "@/lib/appUrl";
import { enviarCorreo } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { definicionSimulacro, factoresSac, mismaFincaSimulacro } from "@/lib/simulacros";
import { fechaHoraColombiaDesdeInput } from "@/lib/actividadesSupervisores";
import { esAnalistaSig } from "@/lib/permisosUsuarios";

function texto(valor: unknown) { return String(valor || "").trim(); }

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Debe iniciar sesión" }, { status: 401 });
  const { id } = await context.params;
  const simulacro = await prisma.simulacroActividad.findUnique({ where: { id: Number(id) }, include: { actividadSupervisor: true, solicitudAccion: true } });
  if (!simulacro || !simulacro.requiereSac) return Response.json({ error: "La SAC no está disponible para este simulacro" }, { status: 404 });
  if (simulacro.solicitudAccion) return Response.json({ error: "La SAC ya fue diligenciada" }, { status: 409 });
  const definicion = definicionSimulacro(simulacro.tipo, simulacro.area, simulacro.finca);
  const usuario = await prisma.usuario.findUnique({ where: { email: session.user.email }, select: { cargo: true, fincaEAI: true } });
  const esAnalistaAsignado = esAnalistaSig(usuario?.cargo) && mismaFincaSimulacro(usuario?.fincaEAI, simulacro.finca);
  const esAdmin = ["ADMIN", "JEFE_SEG", "DIRECTOR_SEG"].includes(String(session.user.role || ""));
  if (!esAnalistaAsignado && !esAdmin) return Response.json({ error: "Solo el Analista SIG asignado puede diligenciar esta SAC" }, { status: 403 });
  const correoActor = session.user.email;
  const nombreActor = session.user.name || correoActor;

  try {
    const body = await request.json();
    const descripcionSituacion = texto(body.descripcionSituacion);
    const analisisCausa = texto(body.analisisCausa);
    const correcciones = Array.isArray(body.correcciones) ? body.correcciones.map((item: any) => ({ actividad: texto(item.actividad), responsable: texto(item.responsable), fecha: texto(item.fecha) })).filter((item: any) => item.actividad && item.responsable && item.fecha) : [];
    const factoresCausa = Array.isArray(body.factoresCausa) ? body.factoresCausa.map(texto).filter((item: string) => factoresSac.includes(item as any)) : [];
    const planAccion = Array.isArray(body.planAccion) ? body.planAccion.map((item: any) => ({ actividad: texto(item.actividad), responsable: texto(item.responsable), fecha: texto(item.fecha) })).filter((item: any) => item.actividad && item.responsable && item.fecha) : [];
    const evidencias = Array.isArray(body.evidencias) ? body.evidencias.map((item: any) => ({ url: texto(item.url), nombre: texto(item.nombre), tipo: texto(item.tipo) })).filter((item: any) => item.url && item.nombre) : [];
    const fechaReprogramacion = fechaHoraColombiaDesdeInput(`${texto(body.fechaReprogramacion)}T08:00`);
    if (!descripcionSituacion || !analisisCausa || factoresCausa.length === 0 || planAccion.length === 0 || !fechaReprogramacion || evidencias.length === 0) return Response.json({ error: "Complete la descripción, análisis, factores, plan de acción, fecha solicitada y al menos una evidencia" }, { status: 400 });
    const consecutivo = `SAC-${simulacro.finca}-${String(simulacro.id).padStart(4, "0")}`;
    const sac = await prisma.$transaction(async (tx) => {
      const reprogramada = await tx.actividadSupervisor.create({ data: { fechaPlaneada: fechaReprogramacion, finca: simulacro.finca, actividad: simulacro.tipo, area: simulacro.area, estado: "PENDIENTE_ASIGNAR", creadoPor: nombreActor, creadoPorCorreo: correoActor } });
      return tx.solicitudAccion.create({ data: {
      simulacroId: simulacro.id, consecutivo, estado: "EN_SEGUIMIENTO", tipoAccion: "Correctiva", proceso: texto(body.proceso) || "Seguridad", sistemaGestion: texto(body.sistemaGestion) || "Seguridad Física", norma: texto(body.norma) || null, requisito: texto(body.requisito) || null, responsableProceso: nombreActor,
      descripcionSituacion, correccion: texto(body.correccion) || null, correcciones, analisisCausa, factoresCausa, planAccion,
      seguimiento: Array.isArray(body.seguimiento) ? body.seguimiento : [], eficacia: body.eficacia === true, seCierra: false,
      comentariosCierre: texto(body.comentariosCierre) || null, evidencias, analistaNombre: nombreActor, analistaCorreo: correoActor, analisisRealizadoCargo: usuario?.cargo || "ANALISTA SIG", fechaCierre: null, fechaReprogramacion, actividadReprogramadaId: reprogramada.id,
    } });
    });
    const jefatura = await prisma.usuario.findMany({ where: { activo: true, OR: [{ rol: "JEFE_SEG" }, { cargo: "JEFE SEG" }] }, select: { email: true } });
    const correosJefe = Array.from(new Set(jefatura.map((usuario) => usuario.email).filter(Boolean)));
    if (correosJefe.length) await enviarCorreo({
      to: correosJefe.join(","), cc: definicion?.gerente?.correo,
      subject: `SAC en seguimiento ${consecutivo} - ${simulacro.finca}`,
      html: `<p>Se registró la Solicitud de Acción <strong>${consecutivo}</strong>, originada por el simulacro de ${simulacro.tipo} en la finca ${simulacro.finca}.</p><p>La SAC quedará <strong>en seguimiento</strong> hasta verificar el resultado de la reprogramación solicitada para el <strong>${fechaReprogramacion.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}</strong>. Ingrese a la plataforma para asignar el supervisor correspondiente.</p><p><a href="${getAppUrl()}/solicitudes-accion/${simulacro.id}">Ver detalle de la SAC</a></p>`,
    });
    return Response.json({ ok: true, sacId: sac.id });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "No fue posible guardar la SAC" }, { status: 500 });
  }
}
