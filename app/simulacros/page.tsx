import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mismaFincaSimulacro } from "@/lib/simulacros";

type SimulacroFila = Awaited<ReturnType<typeof obtenerSimulacros>>[number];

async function obtenerSimulacros() {
  return prisma.simulacroActividad.findMany({ include: { actividadSupervisor: true, solicitudAccion: true }, orderBy: [{ finca: "asc" }, { createdAt: "desc" }] });
}

function TablaSimulacros({ simulacros, esAnalista }: { simulacros: SimulacroFila[]; esAnalista: boolean }) {
  return <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Consecutivo</th><th className="p-3">Fecha</th><th className="p-3">Simulacro</th><th className="p-3">Resultado</th><th className="p-3">Cumplimiento</th><th className="p-3">Acciones</th></tr></thead><tbody>{simulacros.map((simulacro) => <tr key={simulacro.id} className="border-t"><td className="p-3 font-semibold">{simulacro.consecutivo || `SIM-${simulacro.id}`}</td><td className="p-3">{simulacro.createdAt.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}</td><td className="p-3">{simulacro.tipo}</td><td className="p-3">{simulacro.resultado}</td><td className="p-3">{simulacro.promedioEvaluacion != null ? `${Math.round(simulacro.promedioEvaluacion * 100)}%` : "—"}</td><td className="p-3"><div className="flex flex-wrap gap-2"><Link className="rounded bg-[#0F3D1F] px-3 py-2 font-semibold text-white" href={`/simulacros/${simulacro.id}`}>Ver detalle</Link><Link className="rounded border px-3 py-2 font-semibold" href={`/api/simulacros/${simulacro.id}/pdf`}>PDF</Link>{esAnalista && simulacro.requiereSac && !simulacro.solicitudAccion && <Link className="rounded bg-amber-500 px-3 py-2 font-semibold text-white" href={`/solicitudes-accion/${simulacro.id}`}>Crear SAC</Link>}{simulacro.solicitudAccion && <Link className="rounded border px-3 py-2 font-semibold" href={`/api/simulacros/${simulacro.id}/sac/pdf`}>PDF SAC</Link>}</div></td></tr>)}</tbody></table></div>;
}

export default async function SimulacrosPage() {
  const sesion = await getServerSession(authOptions);
  if (!sesion?.user?.email) return null;
  const rol = String(sesion.user.role || ""); const esJefatura = ["ADMIN", "JEFE_SEG", "DIRECTOR_SEG"].includes(rol); const esSupervisor = rol === "SUPERVISOR"; const esAnalista = sesion.user.cargo === "ANALISTA SIG";
  if (!esJefatura && !esSupervisor && !esAnalista) return <main className="p-8">No tiene permiso para consultar simulacros.</main>;
  const [todos, usuario] = await Promise.all([obtenerSimulacros(), prisma.usuario.findUnique({ where: { email: sesion.user.email }, select: { fincaEAI: true } })]);
  const simulacros = (esJefatura || esSupervisor) ? todos : todos.filter((item) => mismaFincaSimulacro(usuario?.fincaEAI, item.finca));
  const porFinca = simulacros.reduce<Record<string, SimulacroFila[]>>((grupos, simulacro) => { (grupos[simulacro.finca] ||= []).push(simulacro); return grupos; }, {});
  const agrupar = esJefatura || esSupervisor;
  return <main className="mx-auto max-w-7xl p-6"><h1 className="text-3xl font-bold text-[#0F3D1F]">Simulacros</h1><p className="mt-1 text-slate-600">Histórico, desarrollo, informes y solicitudes de acción correctiva.</p>{simulacros.length === 0 ? <div className="mt-6 rounded-xl border bg-white p-6 text-slate-500">No hay simulacros disponibles.</div> : agrupar ? <div className="mt-6 space-y-4">{Object.entries(porFinca).map(([finca, registros], indice) => <details key={finca} open={indice === 0} className="rounded-xl border bg-white shadow-sm"><summary className="cursor-pointer list-none px-5 py-4 font-bold text-[#0F3D1F]"><span className="mr-3 inline-block rounded-full bg-[#0F3D1F] px-3 py-1 text-xs text-white">{registros.length}</span>{finca} <span className="ml-2 text-sm font-normal text-slate-500">simulacro(s)</span></summary><div className="border-t"><TablaSimulacros simulacros={registros} esAnalista={false} /></div></details>)}</div> : <div className="mt-6 overflow-x-auto rounded-xl border bg-white"><TablaSimulacros simulacros={simulacros} esAnalista /></div>}</main>;
}
