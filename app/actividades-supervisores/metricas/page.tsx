import Image from "next/image";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { puedeVerMetricasActividades } from "@/lib/actividadesSupervisores";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ mes?: string }>;

function partesColombia(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit" }).formatToParts(fecha);
  return Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
}

function rangoMes(mesSolicitado?: string) {
  const actual = partesColombia();
  const coincidencia = String(mesSolicitado || "").match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  const year = coincidencia ? Number(coincidencia[1]) : Number(actual.year);
  const month = coincidencia ? Number(coincidencia[2]) : Number(actual.month);
  const inicioMes = new Date(Date.UTC(year, month - 1, 1, 5));
  return {
    valor: `${year}-${String(month).padStart(2, "0")}`,
    year,
    mes: { inicio: inicioMes, fin: new Date(Date.UTC(year, month, 1, 5)) },
    anio: { inicio: new Date(Date.UTC(year, 0, 1, 5)), fin: new Date(Date.UTC(year + 1, 0, 1, 5)) },
    etiquetaMes: new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "America/Bogota" }).format(inicioMes),
  };
}

function etiquetaMesCorto(year: number, month: number) {
  return new Intl.DateTimeFormat("es-CO", { month: "short", timeZone: "America/Bogota" }).format(new Date(Date.UTC(year, month - 1, 1, 5))).replace(".", "").toUpperCase();
}

function normalizarNombre(valor?: string | null) {
  return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function iniciales(nombre: string) {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
}

function resumenPorEstado(filas: Array<{ estado: string; cumplidaEnFecha: boolean | null; _count: { _all: number } }>) {
  const total = filas.reduce((suma, fila) => suma + fila._count._all, 0);
  const terminadas = filas.filter((fila) => fila.estado === "TERMINADO").reduce((suma, fila) => suma + fila._count._all, 0);
  const cumplidas = filas.filter((fila) => fila.cumplidaEnFecha === true).reduce((suma, fila) => suma + fila._count._all, 0);
  return { total, terminadas, cumplidas, pendientes: total - terminadas, cumplimiento: total ? Math.round((cumplidas / total) * 100) : 0 };
}

export default async function MetricasActividadesPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "";
  const email = String(session?.user?.email || "").trim().toLowerCase();
  if (!puedeVerMetricasActividades(role)) redirect("/dashboard");

  const params = await searchParams;
  const rango = rangoMes(params.mes);
  const alcanceUsuario = role === "SUPERVISOR" ? { supervisorCorreo: email } : {};
  const dondeMes = { fechaPlaneada: { gte: rango.mes.inicio, lt: rango.mes.fin }, ...alcanceUsuario };
  const dondeAnio = { fechaPlaneada: { gte: rango.anio.inicio, lt: rango.anio.fin }, ...alcanceUsuario };

  // Neon agrupa las tarjetas y el detalle. La consulta anual trae solo fecha y cumplimiento para construir doce barras.
  const [estadosAnio, estadosPorSupervisorMes, actividadesPorTipoMes, actividadesAnio] = await Promise.all([
    prisma.actividadSupervisor.groupBy({ by: ["estado", "cumplidaEnFecha"], where: dondeAnio, _count: { _all: true } }),
    prisma.actividadSupervisor.groupBy({ by: ["supervisorNombre", "estado", "cumplidaEnFecha"], where: dondeMes, _count: { _all: true } }),
    prisma.actividadSupervisor.groupBy({ by: ["actividad", "estado", "cumplidaEnFecha"], where: dondeMes, _count: { _all: true }, orderBy: { actividad: "asc" } }),
    prisma.actividadSupervisor.findMany({ where: dondeAnio, select: { fechaPlaneada: true, cumplidaEnFecha: true } }),
  ]);

  const usuariosSupervisores = await prisma.usuario.findMany({
    where: { activo: true, rol: "SUPERVISOR" },
    select: { nombre: true, fotoPerfilUrl: true },
  });
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
  const meses = Array.from({ length: 12 }, (_, indice) => ({ month: indice + 1, total: 0, cumplidas: 0 }));
  for (const actividad of actividadesAnio) {
    const month = Number(new Intl.DateTimeFormat("en-CA", { month: "numeric", timeZone: "America/Bogota" }).format(actividad.fechaPlaneada));
    const fila = meses[month - 1];
    if (fila) { fila.total += 1; if (actividad.cumplidaEnFecha === true) fila.cumplidas += 1; }
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold text-[#0F3D1F]">Métricas de actividades</h1><p className="mt-1 text-slate-600">Acumulado {rango.year} y cumplimiento de <span className="capitalize">{rango.etiquetaMes}</span>.</p></div><form action="/actividades-supervisores/metricas" className="flex items-end gap-2 rounded-xl border bg-white p-3 shadow-sm"><label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Mes<input name="mes" type="month" defaultValue={rango.valor} className="rounded-lg border p-2 font-normal" /></label><button className="rounded-lg bg-[#0F3D1F] px-4 py-2 font-semibold text-white">Ver métricas</button></form></div>
    <section><h2 className="mb-3 text-lg font-bold text-[#0F3D1F]">Acumulado del año</h2><div className="grid gap-4 md:grid-cols-5"><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Programadas</p><p className="text-3xl font-bold">{anual.total}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Ejecutadas</p><p className="text-3xl font-bold text-green-700">{anual.terminadas}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Cumplidas en fecha</p><p className="text-3xl font-bold text-green-700">{anual.cumplidas}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Pendientes</p><p className="text-3xl font-bold text-amber-700">{anual.pendientes}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Cumplimiento</p><p className="text-3xl font-bold text-[#0F3D1F]">{anual.cumplimiento}%</p></div></div></section>
    <section className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-[#0F3D1F]">Cumplimiento mensual del departamento</h2><p className="mt-1 text-sm text-slate-500">Porcentaje de actividades cumplidas en la fecha planeada durante {rango.year}.</p></div><span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">General anual: {anual.cumplimiento}%</span></div><div className="mt-6 flex min-h-64 items-end gap-2 overflow-x-auto border-b border-slate-200 pb-7">{meses.map((fila) => { const porcentaje = fila.total ? Math.round((fila.cumplidas / fila.total) * 100) : 0; return <div key={fila.month} className="flex min-w-14 flex-1 flex-col items-center justify-end gap-2"><span className="text-xs font-bold text-[#0F3D1F]">{fila.total ? `${porcentaje}%` : "—"}</span><div title={`${etiquetaMesCorto(rango.year, fila.month)}: ${fila.cumplidas}/${fila.total} cumplidas (${porcentaje}%)`} className="flex h-44 w-9 items-start justify-center rounded-t-md bg-green-600 pt-1 text-xs font-bold text-white" style={{ height: fila.total ? `${Math.max(10, porcentaje)}%` : "3px" }}>{fila.total ? fila.cumplidas : ""}</div><span className="text-xs font-bold text-slate-600">{etiquetaMesCorto(rango.year, fila.month)}</span></div>; })}</div><p className="mt-3 text-xs text-slate-500">Cada barra representa el porcentaje de cumplimiento. El número dentro de la barra corresponde a las actividades cumplidas en fecha.</p></section>
    <div className="grid gap-6 xl:grid-cols-2"><section className="rounded-xl border bg-white p-5"><h2 className="text-xl font-bold text-[#0F3D1F]">Cumplimiento por supervisor</h2><p className="mt-1 capitalize text-sm text-slate-500">{rango.etiquetaMes}</p><div className="mt-5 space-y-5">{porSupervisor.map(([nombre, fila]) => { const porcentaje = fila.total ? Math.round((fila.cumplidas / fila.total) * 100) : 0; const nombreNormalizado = normalizarNombre(nombre); const foto = usuariosSupervisores.find((usuario) => { const nombreUsuario = normalizarNombre(usuario.nombre); return nombreUsuario.includes(nombreNormalizado) || nombreNormalizado.includes(nombreUsuario); })?.fotoPerfilUrl; return <div key={nombre}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="flex items-center gap-2 font-semibold"><span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0F3D1F] text-[10px] text-white">{foto ? <Image src={foto} alt={`Foto de ${nombre}`} fill unoptimized sizes="28px" className="object-cover" /> : iniciales(nombre)}</span>{nombre}</span><span>{fila.cumplidas}/{fila.total} cumplidas · {porcentaje}%</span></div><div className="h-4 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-[#2FAE4A]" style={{ width: `${porcentaje}%` }} /></div><p className="mt-1 text-xs text-slate-500">Ejecutadas: {fila.terminadas} · Pendientes: {fila.total - fila.terminadas}</p></div>; })}{porSupervisor.length === 0 && <p className="text-slate-500">No hay actividades para este mes.</p>}</div></section>
      <section className="rounded-xl border bg-white p-5"><h2 className="text-xl font-bold text-[#0F3D1F]">Actividades realizadas por tipo</h2><p className="mt-1 capitalize text-sm text-slate-500">{rango.etiquetaMes}</p><div className="mt-5 overflow-x-auto"><table className="w-full text-sm"><thead className="border-b text-left text-slate-500"><tr><th className="pb-2">Actividad</th><th className="pb-2 text-center">Programadas</th><th className="pb-2 text-center">Ejecutadas</th><th className="pb-2 text-center">En fecha</th></tr></thead><tbody>{porTipo.map(([actividad, fila]) => <tr key={actividad} className="border-b last:border-0"><td className="py-3 font-medium">{actividad}</td><td className="py-3 text-center">{fila.total}</td><td className="py-3 text-center font-bold text-green-700">{fila.terminadas}</td><td className="py-3 text-center font-bold text-green-700">{fila.cumplidas}</td></tr>)}{porTipo.length === 0 && <tr><td colSpan={4} className="py-5 text-center text-slate-500">No hay actividades para este mes.</td></tr>}</tbody></table></div></section></div>
  </div>;
}
