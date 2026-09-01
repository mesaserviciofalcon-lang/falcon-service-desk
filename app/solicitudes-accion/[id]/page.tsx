import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import FormularioSac from "@/components/FormularioSac";
import { authOptions } from "@/lib/auth";
import { esDelAnoActualColombia, mismaFincaSimulacro } from "@/lib/simulacros";
import { prisma } from "@/lib/prisma";

type Fila = { actividad: string; responsable: string; fecha: string };
type Archivo = { url: string; nombre: string; tipo?: string };

export default async function SolicitudAccionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const simulacro = await prisma.simulacroActividad.findUnique({ where: { id: Number(id) }, include: { solicitudAccion: true } });
  if (!simulacro?.requiereSac) notFound();
  const usuario = session?.user?.email ? await prisma.usuario.findUnique({ where: { email: session.user.email }, select: { cargo: true, fincaEAI: true } }) : null;
  const rol = String(session?.user?.role || "");
  const esAnalista = usuario?.cargo === "ANALISTA SIG" && mismaFincaSimulacro(usuario.fincaEAI, simulacro.finca);
  const puedeVer = esAnalista || ["ADMIN", "JEFE_SEG", "DIRECTOR_SEG", "SUPERVISOR"].includes(rol);
  if (!puedeVer) redirect("/dashboard");
  if (!["ADMIN", "JEFE_SEG"].includes(rol) && !esDelAnoActualColombia(simulacro.createdAt)) redirect("/simulacros");

  if (!simulacro.solicitudAccion) {
    if (!esAnalista && !["ADMIN", "JEFE_SEG", "DIRECTOR_SEG"].includes(rol)) redirect(`/simulacros/${simulacro.id}`);
    return <FormularioSac simulacro={simulacro} responsableInicial={session?.user?.name || session?.user?.email || "Analista SIG"} />;
  }

  const sac = simulacro.solicitudAccion;
  const correcciones = (sac.correcciones as Fila[] | null) || [];
  const plan = (sac.planAccion as Fila[] | null) || [];
  const evidencias = (sac.evidencias as Archivo[] | null) || [];
  return <main className="mx-auto max-w-5xl p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-3xl font-bold text-[#0F3D1F]">Solicitud de Acción Correctiva</h1><p className="mt-1 text-slate-600">{sac.consecutivo} · Originada en {simulacro.tipo} · {simulacro.finca}</p></div><div className="flex gap-2"><Link href="/simulacros" className="rounded border px-4 py-2 font-semibold">Volver a simulacros</Link><a href={`/api/simulacros/${simulacro.id}/sac/pdf`} target="_blank" rel="noreferrer" className="rounded bg-[#0F3D1F] px-4 py-2 font-semibold text-white">Ver PDF SAC</a></div></div><section className="mt-6 space-y-5 rounded-xl border bg-white p-6"><div className="grid gap-3 md:grid-cols-3"><p><strong>Tipo de acción:</strong> Correctiva</p><p><strong>Responsable:</strong> {sac.responsableProceso || sac.analistaNombre}</p><p><strong>Proceso:</strong> {sac.proceso}</p><p><strong>Sistema de gestión:</strong> {sac.sistemaGestion}</p><p><strong>Norma:</strong> {sac.norma || "—"}</p><p><strong>Requisito:</strong> {sac.requisito || "—"}</p></div><Detalle titulo="1. Descripción de la situación" texto={sac.descripcionSituacion} /><Tabla titulo="2. Corrección (si aplica)" filas={correcciones} /><Detalle titulo="3. Análisis de causa raíz" texto={sac.analisisCausa} /><Detalle titulo="Factores de causa" texto={((sac.factoresCausa as string[]) || []).join(" · ")} /><Tabla titulo="4. Plan de acción" filas={plan} /><Detalle titulo="5. Seguimiento / comentarios de cierre" texto={sac.comentariosCierre || "Sin comentarios"} /><p><strong>Evaluación de eficacia:</strong> {sac.eficacia ? "Sí" : "No"}</p><div><h2 className="font-bold">Evidencias del cierre</h2>{evidencias.length ? <div className="mt-2 space-y-2">{evidencias.map((archivo) => <a key={archivo.url} href={archivo.url} target="_blank" rel="noreferrer" className="block rounded border bg-slate-50 p-3 text-[#0F3D1F] underline">{archivo.nombre}</a>)}</div> : <p className="mt-2 text-slate-500">Sin evidencias registradas.</p>}</div></section></main>;
}

function Detalle({ titulo, texto }: { titulo: string; texto: string }) { return <div><h2 className="font-bold">{titulo}</h2><p className="mt-1 whitespace-pre-wrap rounded bg-slate-50 p-3">{texto || "—"}</p></div>; }
function Tabla({ titulo, filas }: { titulo: string; filas: Fila[] }) { return <div><h2 className="font-bold">{titulo}</h2>{filas.length ? <div className="mt-2 overflow-x-auto"><table className="min-w-full border text-sm"><thead className="bg-slate-50"><tr><th className="border p-2 text-left">Actividad</th><th className="border p-2 text-left">Responsable</th><th className="border p-2 text-left">Fecha</th></tr></thead><tbody>{filas.map((fila, indice) => <tr key={indice}><td className="border p-2">{fila.actividad}</td><td className="border p-2">{fila.responsable}</td><td className="border p-2">{fila.fecha}</td></tr>)}</tbody></table></div> : <p className="mt-1 text-slate-500">No registra filas.</p>}</div>; }
