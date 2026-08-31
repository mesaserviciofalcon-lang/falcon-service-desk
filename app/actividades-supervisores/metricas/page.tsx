import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { puedeVerMetricasActividades } from "@/lib/actividadesSupervisores";
import { prisma } from "@/lib/prisma";

function rangosColombia() {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const valor = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  const year = Number(valor.year);
  const month = Number(valor.month);
  return {
    mes: { inicio: new Date(Date.UTC(year, month - 1, 1, 5)), fin: new Date(Date.UTC(year, month, 1, 5)) },
    anio: { inicio: new Date(Date.UTC(year, 0, 1, 5)), fin: new Date(Date.UTC(year + 1, 0, 1, 5)) },
    etiquetaMes: new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "America/Bogota" }).format(new Date()),
    year,
  };
}

function resumenPorEstado(filas: Array<{ estado: string; cumplidaEnFecha: boolean | null; _count: { _all: number } }>) {
  const total = filas.reduce((suma, fila) => suma + fila._count._all, 0);
  const terminadas = filas.filter((fila) => fila.estado === "TERMINADO").reduce((suma, fila) => suma + fila._count._all, 0);
  const cumplidas = filas.filter((fila) => fila.cumplidaEnFecha === true).reduce((suma, fila) => suma + fila._count._all, 0);
  return { total, terminadas, cumplidas, pendientes: total - terminadas, cumplimiento: total ? Math.round((cumplidas / total) * 100) : 0 };
}

export default async function MetricasActividadesPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "";
  const email = String(session?.user?.email || "").trim().toLowerCase();
  if (!puedeVerMetricasActividades(role)) redirect("/dashboard");

  const rango = rangosColombia();
  const alcanceUsuario = role === "SUPERVISOR" ? { supervisorCorreo: email } : {};
  const dondeMes = { fechaPlaneada: { gte: rango.mes.inicio, lt: rango.mes.fin }, ...alcanceUsuario };
  const dondeAnio = { fechaPlaneada: { gte: rango.anio.inicio, lt: rango.anio.fin }, ...alcanceUsuario };

  // Consultas agregadas: Neon calcula los conteos y no se descargan actividades individuales.
  const [estadosAnio, estadosPorSupervisorMes, actividadesPorTipoMes] = await Promise.all([
    prisma.actividadSupervisor.groupBy({ by: ["estado", "cumplidaEnFecha"], where: dondeAnio, _count: { _all: true } }),
    prisma.actividadSupervisor.groupBy({ by: ["supervisorNombre", "estado", "cumplidaEnFecha"], where: dondeMes, _count: { _all: true } }),
    prisma.actividadSupervisor.groupBy({ by: ["actividad", "estado", "cumplidaEnFecha"], where: dondeMes, _count: { _all: true }, orderBy: { actividad: "asc" } }),
  ]);

  const anual = resumenPorEstado(estadosAnio);
  const porSupervisor = Object.entries(estadosPorSupervisorMes.reduce<Record<string, { total: number; terminadas: number; cumplidas: number }>>((acumulado, fila) => {
    const nombre = fila.supervisorNombre || "Sin asignar";
    const actual = acumulado[nombre] || { total: 0, terminadas: 0, cumplidas: 0 };
    actual.total += fila._count._all;
    if (fila.estado === "TERMINADO") actual.terminadas += fila._count._all;
    if (fila.cumplidaEnFecha === true) actual.cumplidas += fila._count._all;
    acumulado[nombre] = actual;
    return acumulado;
  }, {})).sort(([a], [b]) => a.localeCompare(b, "es"));
  const porTipo = Object.entries(actividadesPorTipoMes.reduce<Record<string, { total: number; terminadas: number; cumplidas: number }>>((acumulado, fila) => {
    const actual = acumulado[fila.actividad] || { total: 0, terminadas: 0, cumplidas: 0 };
    actual.total += fila._count._all;
    if (fila.estado === "TERMINADO") actual.terminadas += fila._count._all;
    if (fila.cumplidaEnFecha === true) actual.cumplidas += fila._count._all;
    acumulado[fila.actividad] = actual;
    return acumulado;
  }, {}));

  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold text-[#0F3D1F]">Métricas de actividades</h1><p className="mt-1 text-slate-600">Acumulado {rango.year} y cumplimiento de {rango.etiquetaMes}.</p></div>
    <section><h2 className="mb-3 text-lg font-bold text-[#0F3D1F]">Acumulado del año</h2><div className="grid gap-4 md:grid-cols-5"><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Programadas</p><p className="text-3xl font-bold">{anual.total}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Ejecutadas</p><p className="text-3xl font-bold text-green-700">{anual.terminadas}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Cumplidas en fecha</p><p className="text-3xl font-bold text-green-700">{anual.cumplidas}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Pendientes</p><p className="text-3xl font-bold text-amber-700">{anual.pendientes}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Cumplimiento</p><p className="text-3xl font-bold text-[#0F3D1F]">{anual.cumplimiento}%</p></div></div></section>
    <div className="grid gap-6 xl:grid-cols-2"><section className="rounded-xl border bg-white p-5"><h2 className="text-xl font-bold text-[#0F3D1F]">Cumplimiento por supervisor</h2><p className="mt-1 text-sm text-slate-500">{rango.etiquetaMes}</p><div className="mt-5 space-y-5">{porSupervisor.map(([nombre, fila]) => { const porcentaje = fila.total ? Math.round((fila.cumplidas / fila.total) * 100) : 0; return <div key={nombre}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="font-semibold">{nombre}</span><span>{fila.cumplidas}/{fila.total} cumplidas · {porcentaje}%</span></div><div className="h-4 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-[#2FAE4A]" style={{ width: `${porcentaje}%` }} /></div><p className="mt-1 text-xs text-slate-500">Ejecutadas: {fila.terminadas} · Pendientes: {fila.total - fila.terminadas}</p></div>; })}{porSupervisor.length === 0 && <p className="text-slate-500">No hay actividades para este mes.</p>}</div></section>
      <section className="rounded-xl border bg-white p-5"><h2 className="text-xl font-bold text-[#0F3D1F]">Actividades realizadas por tipo</h2><p className="mt-1 text-sm text-slate-500">{rango.etiquetaMes}</p><div className="mt-5 overflow-x-auto"><table className="w-full text-sm"><thead className="border-b text-left text-slate-500"><tr><th className="pb-2">Actividad</th><th className="pb-2 text-center">Programadas</th><th className="pb-2 text-center">Ejecutadas</th><th className="pb-2 text-center">En fecha</th></tr></thead><tbody>{porTipo.map(([actividad, fila]) => <tr key={actividad} className="border-b last:border-0"><td className="py-3 font-medium">{actividad}</td><td className="py-3 text-center">{fila.total}</td><td className="py-3 text-center font-bold text-green-700">{fila.terminadas}</td><td className="py-3 text-center font-bold text-green-700">{fila.cumplidas}</td></tr>)}{porTipo.length === 0 && <tr><td colSpan={4} className="py-5 text-center text-slate-500">No hay actividades para este mes.</td></tr>}</tbody></table></div></section></div>
  </div>;
}
