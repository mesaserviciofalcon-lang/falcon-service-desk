import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import GestionSimulacro from "@/components/GestionSimulacro";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcularPromedioSimulacro, definicionSimulacro, mismaFincaSimulacro } from "@/lib/simulacros";

export default async function DetalleSimulacro({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await getServerSession(authOptions); const { id } = await params;
  const simulacro = await prisma.simulacroActividad.findUnique({ where: { id: Number(id) }, include: { solicitudAccion: true } });
  if (!simulacro) notFound(); if (!sesion?.user?.email) redirect("/login");
  const rol = String(sesion.user.role || ""); const definicion = definicionSimulacro(simulacro.tipo, simulacro.area, simulacro.finca); const usuario = await prisma.usuario.findUnique({ where: { email: sesion.user.email }, select: { cargo: true, fincaEAI: true } });
  const puedeVer = ["ADMIN", "JEFE_SEG", "DIRECTOR_SEG", "SUPERVISOR"].includes(rol) || (usuario?.cargo === "ANALISTA SIG" && mismaFincaSimulacro(usuario.fincaEAI, simulacro.finca));
  if (!puedeVer) redirect("/dashboard");
  const aspectos = simulacro.aspectos as Array<{ nombre: string; calificacion: number }>;
  const promedio = calcularPromedioSimulacro(aspectos);
  return <main className="mx-auto max-w-5xl p-6"><div className="flex justify-between gap-4"><div><h1 className="text-3xl font-bold text-[#0F3D1F]">{simulacro.consecutivo || `SIM-${simulacro.id}`}</h1><p className="text-slate-600">{simulacro.tipo} · {simulacro.finca}</p></div><Link href="/simulacros" className="rounded border px-4 py-2 font-semibold">Volver</Link></div><section className="mt-6 space-y-5 rounded-xl border bg-white p-6"><div className="grid gap-3 md:grid-cols-3"><p><strong>Resultado:</strong> {simulacro.resultado}</p><p><strong>Evaluación:</strong> {promedio != null ? `${promedio.toFixed(2)} / 1 (${Math.round(promedio * 100)}%)` : "—"}</p><p><strong>Inicio / duración:</strong> {simulacro.horaInicio} · {simulacro.duracionMinutos || "—"} min</p></div><div><h2 className="font-bold">Cumplimiento del objetivo</h2><p className="whitespace-pre-wrap">{simulacro.cumplimientoObjetivo}</p></div><div><h2 className="font-bold">Desarrollo del simulacro</h2><p className="whitespace-pre-wrap rounded bg-slate-50 p-4">{simulacro.desarrollo}</p></div><div><h2 className="font-bold">Aspectos evaluados</h2><ul className="mt-2 list-disc pl-5">{aspectos.map((aspecto) => <li key={aspecto.nombre}>{aspecto.nombre}: {aspecto.calificacion}</li>)}</ul></div><div><h2 className="font-bold">Conclusión</h2><p className="whitespace-pre-wrap">{simulacro.conclusion}</p></div><div className="flex gap-3"><a className="rounded bg-[#0F3D1F] px-4 py-2 font-semibold text-white" href={`/api/simulacros/${simulacro.id}/pdf`} target="_blank" rel="noreferrer">Ver informe PDF</a>{simulacro.solicitudAccion && <a className="rounded border px-4 py-2 font-semibold" href={`/api/simulacros/${simulacro.id}/sac/pdf`} target="_blank" rel="noreferrer">Ver PDF SAC</a>}</div><GestionSimulacro simulacro={simulacro} puedeEditar={["ADMIN", "JEFE_SEG"].includes(rol)} puedeEliminar={rol === "ADMIN"} /></section></main>;
}
