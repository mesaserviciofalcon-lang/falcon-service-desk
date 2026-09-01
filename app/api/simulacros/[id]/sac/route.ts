import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAppUrl } from "@/lib/appUrl";
import { enviarCorreo } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { definicionSimulacro, factoresSac } from "@/lib/simulacros";
import { generarPdfSac } from "@/lib/simulacrosPdf";
import { fechaHoraColombiaDesdeInput } from "@/lib/actividadesSupervisores";

function texto(valor: unknown) { return String(valor || "").trim(); }

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Debe iniciar sesión" }, { status: 401 });
  const { id } = await context.params;
  const simulacro = await prisma.simulacroActividad.findUnique({ where: { id: Number(id) }, include: { actividadSupervisor: true, solicitudAccion: true } });
  if (!simulacro || !simulacro.requiereSac) return Response.json({ error: "La SAC no está disponible para este simulacro" }, { status: 404 });
  if (simulacro.solicitudAccion) return Response.json({ error: "La SAC ya fue diligenciada" }, { status: 409 });
  const definicion = definicionSimulacro(simulacro.tipo, simulacro.area, simulacro.finca);
  const esAnalistaAsignado = session.user.cargo === "ANALISTA SIG" && definicion?.correoAnalista?.toLowerCase() === session.user.email.toLowerCase();
  const esAdmin = ["ADMIN", "JEFE_SEG", "DIRECTOR_SEG"].includes(String(session.user.role || ""));
  if (!esAnalistaAsignado && !esAdmin) return Response.json({ error: "Solo el Analista SIG asignado puede diligenciar esta SAC" }, { status: 403 });
  const correoActor = session.user.email;
  const nombreActor = session.user.name || correoActor;

  try {
    const body = await request.json();
    const descripcionSituacion = texto(body.descripcionSituacion);
    const analisisCausa = texto(body.analisisCausa);
    const factoresCausa = Array.isArray(body.factoresCausa) ? body.factoresCausa.map(texto).filter((item: string) => factoresSac.includes(item as any)) : [];
    const planAccion = Array.isArray(body.planAccion) ? body.planAccion.map((item: any) => ({ actividad: texto(item.actividad), responsable: texto(item.responsable), fecha: texto(item.fecha) })).filter((item: any) => item.actividad && item.responsable && item.fecha) : [];
    const fechaReprogramacion = fechaHoraColombiaDesdeInput(`${texto(body.fechaReprogramacion)}T08:00`);
    if (!descripcionSituacion || !analisisCausa || factoresCausa.length === 0 || planAccion.length === 0 || !fechaReprogramacion) return Response.json({ error: "Complete la descripción, análisis, factores, plan de acción y fecha solicitada de reprogramación" }, { status: 400 });
    const consecutivo = `SAC-${simulacro.finca}-${String(simulacro.id).padStart(4, "0")}`;
    const sac = await prisma.$transaction(async (tx) => {
      const reprogramada = await tx.actividadSupervisor.create({ data: { fechaPlaneada: fechaReprogramacion, finca: simulacro.finca, actividad: simulacro.tipo, area: simulacro.area, estado: "PENDIENTE_ASIGNAR", creadoPor: nombreActor, creadoPorCorreo: correoActor } });
      return tx.solicitudAccion.create({ data: {
      simulacroId: simulacro.id, consecutivo, estado: "CERRADA", tipoAccion: texto(body.tipoAccion) || "Correctiva", proceso: texto(body.proceso) || "Seguridad", sistemaGestion: texto(body.sistemaGestion) || "Seguridad Física", responsableProceso: texto(body.responsableProceso) || null,
      descripcionSituacion, correccion: texto(body.correccion) || null, analisisCausa, factoresCausa, planAccion,
      seguimiento: Array.isArray(body.seguimiento) ? body.seguimiento : [], eficacia: body.eficacia === true, seCierra: true,
      comentariosCierre: texto(body.comentariosCierre) || null, analistaNombre: nombreActor, analistaCorreo: correoActor, fechaCierre: new Date(), fechaReprogramacion, actividadReprogramadaId: reprogramada.id,
    } });
    });
    const pdf = await generarPdfSac({ ...sac, consecutivo: sac.consecutivo || consecutivo, finca: simulacro.finca, factoresCausa: factoresCausa as string[], planAccion, seguimiento: sac.seguimiento as any });
    const jefatura = await prisma.usuario.findMany({ where: { activo: true, OR: [{ rol: { in: ["JEFE_SEG", "DIRECTOR_SEG"] } }, { cargo: { in: ["JEFE SEG", "DIRECTOR SEG"] } }] }, select: { email: true } });
    const correosJefe = Array.from(new Set(jefatura.map((usuario) => usuario.email).filter(Boolean)));
    if (correosJefe.length) await enviarCorreo({
      to: correosJefe.join(","), cc: definicion?.gerente?.correo,
      subject: `Cierre SAC ${consecutivo} - ${simulacro.finca}`,
      html: `<p>Se informa el cierre de la Solicitud de Acción <strong>${consecutivo}</strong>, originada por el simulacro de ${simulacro.tipo} en la finca ${simulacro.finca}.</p><p>La finca solicitó reprogramar el simulacro para el <strong>${fechaReprogramacion.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}</strong>. Ingrese a la plataforma para asignar el supervisor correspondiente.</p><p><a href="${getAppUrl()}/api/simulacros/${simulacro.id}/sac/pdf">Ver PDF de la SAC</a></p>`,
      attachments: [{ filename: `${consecutivo}.pdf`, content: pdf, contentType: "application/pdf" }],
    });
    return Response.json({ ok: true, sacId: sac.id });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "No fue posible guardar la SAC" }, { status: 500 });
  }
}
