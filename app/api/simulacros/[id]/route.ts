import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requiereSac } from "@/lib/simulacros";

function texto(valor: unknown) { return String(valor || "").trim(); }

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const sesion = await getServerSession(authOptions);
  if (!sesion?.user?.email) return Response.json({ error: "Debe iniciar sesión" }, { status: 401 });
  if (!["ADMIN", "JEFE_SEG"].includes(String(sesion.user.role || ""))) return Response.json({ error: "Solo Administración y Jefe de Seguridad pueden editar simulacros" }, { status: 403 });
  const { id } = await context.params; const actual = await prisma.simulacroActividad.findUnique({ where: { id: Number(id) }, include: { solicitudAccion: true } });
  if (!actual) return Response.json({ error: "Simulacro no encontrado" }, { status: 404 });
  const body = await request.json(); const resultado = texto(body.resultado).toUpperCase();
  if (!["DETECTADO", "NO DETECTADO"].includes(resultado)) return Response.json({ error: "Resultado inválido" }, { status: 400 });
  const requiere = requiereSac(resultado) || (actual.promedioEvaluacion != null && actual.promedioEvaluacion <= 0.5);
  if (actual.solicitudAccion && !requiere) return Response.json({ error: "No puede retirar la SAC requerida porque ya existe una SAC cerrada" }, { status: 400 });
  const actualizado = await prisma.simulacroActividad.update({ where: { id: actual.id }, data: { resultado, cumplimientoObjetivo: texto(body.cumplimientoObjetivo), desarrollo: texto(body.desarrollo), conclusion: texto(body.conclusion), controlVulnerado: texto(body.controlVulnerado) || null, razonIncumplimiento: texto(body.razonIncumplimiento) || null, requiereSac: requiere, sacSugerida: requiere ? `SAC sugerida tras edición: ${resultado === "NO DETECTADO" ? "resultado no detectado" : "promedio igual o inferior a 0,5 (50%)"}. Conclusión: ${texto(body.conclusion)}` : null } });
  return Response.json({ ok: true, simulacro: actualizado });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const sesion = await getServerSession(authOptions);
  if (!sesion?.user?.email) return Response.json({ error: "Debe iniciar sesión" }, { status: 401 });
  if (sesion.user.role !== "ADMIN") return Response.json({ error: "Solo el Administrador Master puede eliminar simulacros" }, { status: 403 });
  const { id } = await context.params; const simulacro = await prisma.simulacroActividad.findUnique({ where: { id: Number(id) } });
  if (!simulacro) return Response.json({ error: "Simulacro no encontrado" }, { status: 404 });
  await prisma.actividadSupervisor.delete({ where: { id: simulacro.actividadId } });
  return Response.json({ ok: true });
}
