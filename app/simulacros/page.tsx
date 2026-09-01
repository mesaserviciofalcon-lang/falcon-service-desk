import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { definicionSimulacro } from "@/lib/simulacros";

export default async function SimulacrosPage() {
  const sesion = await getServerSession(authOptions);
  if (!sesion?.user?.email) return null;
  const rol = String(sesion.user.role || "");
  const esJefatura = ["ADMIN", "JEFE_SEG", "DIRECTOR_SEG"].includes(rol);
  const esSupervisor = rol === "SUPERVISOR";
  const esAnalista = sesion.user.cargo === "ANALISTA SIG";
  if (!esJefatura && !esSupervisor && !esAnalista) return <main className="p-8">No tiene permiso para consultar simulacros.</main>;
  const todos = await prisma.simulacroActividad.findMany({ include: { actividadSupervisor: true, solicitudAccion: true }, orderBy: { createdAt: "desc" } });
  const simulacros = (esJefatura || esSupervisor) ? todos : todos.filter((item) => definicionSimulacro(item.tipo, item.area, item.finca)?.correoAnalista?.toLowerCase() === sesion.user.email!.toLowerCase());
  return <main className="mx-auto max-w-7xl p-6"><h1 className="text-3xl font-bold text-[#0F3D1F]">Simulacros</h1><p className="mt-1 text-slate-600">Histórico, desarrollo, informes y solicitudes de acción correctiva.</p><div className="mt-6 overflow-x-auto rounded-xl border bg-white"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Consecutivo</th><th className="p-3">Fecha</th><th className="p-3">Finca</th><th className="p-3">Simulacro</th><th className="p-3">Resultado</th><th className="p-3">Cumplimiento</th><th className="p-3">Acciones</th></tr></thead><tbody>{simulacros.map((simulacro) => <tr key={simulacro.id} className="border-t"><td className="p-3 font-semibold">{simulacro.consecutivo || `SIM-${simulacro.id}`}</td><td className="p-3">{simulacro.createdAt.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}</td><td className="p-3">{simulacro.finca}</td><td className="p-3">{simulacro.tipo}</td><td className="p-3">{simulacro.resultado}</td><td className="p-3">{simulacro.promedioEvaluacion != null ? `${Math.round(simulacro.promedioEvaluacion * 100)}%` : "—"}</td><td className="p-3"><div className="flex flex-wrap gap-2"><Link className="rounded bg-[#0F3D1F] px-3 py-2 font-semibold text-white" href={`/simulacros/${simulacro.id}`}>Ver detalle</Link><Link className="rounded border px-3 py-2 font-semibold" href={`/api/simulacros/${simulacro.id}/pdf`}>PDF</Link>{esAnalista && simulacro.requiereSac && !simulacro.solicitudAccion && <Link className="rounded bg-amber-500 px-3 py-2 font-semibold text-white" href={`/solicitudes-accion/${simulacro.id}`}>Crear SAC</Link>}{simulacro.solicitudAccion && <Link className="rounded border px-3 py-2 font-semibold" href={`/api/simulacros/${simulacro.id}/sac/pdf`}>PDF SAC</Link>}</div></td></tr>)}</tbody></table>{simulacros.length === 0 && <p className="p-6 text-slate-500">No hay simulacros disponibles.</p>}</div></main>;
}
