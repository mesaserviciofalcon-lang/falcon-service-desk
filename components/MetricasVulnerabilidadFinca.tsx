import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { estaVencidoCierreVulnerabilidad } from "@/lib/vulnerabilidades";

function mesActualBogota() {
  return new Date().toLocaleDateString("sv-SE", { year: "numeric", month: "2-digit", timeZone: "America/Bogota" });
}

function rangoMes(mes: string) {
  const coincidencia = mes.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  const valor = coincidencia ? mes : mesActualBogota();
  const [anio, mesNumero] = valor.split("-").map(Number);
  return { valor, inicio: new Date(Date.UTC(anio, mesNumero - 1, 1, 5)), fin: new Date(Date.UTC(anio, mesNumero, 1, 5)), etiqueta: new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "America/Bogota" }).format(new Date(Date.UTC(anio, mesNumero - 1, 1, 5))) };
}

export default async function MetricasVulnerabilidadFinca({ fincas, mes }: { fincas: string[]; mes?: string }) {
  const rango = rangoMes(mes || mesActualBogota());
  const alcanceFincas = { in: fincas, mode: "insensitive" as const };
  const where = { eai: alcanceFincas, fecha: { gte: rango.inicio, lt: rango.fin } };
  const [total, abiertos, cerrados, pendientesAbiertos, porActo, detalles] = await Promise.all([
    prisma.vulnerabilidadInforme.count({ where }),
    prisma.vulnerabilidadInforme.count({ where: { ...where, estado: { not: "CERRADO" } } }),
    prisma.vulnerabilidadInforme.count({ where: { ...where, estado: "CERRADO" } }),
    prisma.vulnerabilidadInforme.findMany({ where: { eai: alcanceFincas, estado: { not: "CERRADO" } }, select: { fecha: true, actoInseguro: true } }),
    prisma.vulnerabilidadInforme.groupBy({ by: ["actoInseguro", "estado"], where, _count: { _all: true }, orderBy: { _count: { actoInseguro: "desc" } } }),
    prisma.vulnerabilidadInforme.findMany({ where, select: { id: true, consecutivo: true, fecha: true, actoInseguro: true, estado: true, vulnerabilidad: true, reportadoPor: true, supervisor: true }, orderBy: [{ fecha: "desc" }, { id: "desc" }] }),
  ]);
  const pendientesVencidos = pendientesAbiertos.filter((informe) => estaVencidoCierreVulnerabilidad(informe.fecha, informe.actoInseguro)).length;
  const actos = porActo.reduce<Record<string, { abiertos: number; cerrados: number }>>((acumulado, fila) => { const acto = fila.actoInseguro || "Sin acto"; const actual = acumulado[acto] || { abiertos: 0, cerrados: 0 }; if (fila.estado === "CERRADO") actual.cerrados += fila._count._all; else actual.abiertos += fila._count._all; acumulado[acto] = actual; return acumulado; }, {});
  const etiquetaFincas = fincas.join(" y ");
  return <main className="mx-auto max-w-6xl space-y-6 p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold text-[#0F3D1F]">Métricas de análisis de vulnerabilidad</h1><p className="mt-1 text-slate-600">Indicadores de las fincas a su cargo: <strong>{etiquetaFincas}</strong>.</p></div><form action="/vulnerabilidades/metricas" className="flex items-end gap-2 rounded-xl border bg-white p-3 shadow-sm"><label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Mes<input type="month" name="mes" defaultValue={rango.valor} className="rounded-lg border p-2 font-normal" /></label><button className="rounded-lg bg-[#0F3D1F] px-4 py-2 font-semibold text-white">Ver métricas</button></form></div><p className="capitalize text-sm text-slate-500">Indicadores de {rango.etiqueta}. Puede consultar los meses anteriores de sus fincas.</p>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Tarjeta titulo="Análisis registrados" valor={total} /><Tarjeta titulo="Abiertos" valor={abiertos} color="text-red-700" /><Tarjeta titulo="Cerrados" valor={cerrados} color="text-green-700" /><Tarjeta titulo="Pendientes vencidos" valor={pendientesVencidos} color="text-amber-700" /></section>
    <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[#0F3D1F]">Actos inseguros de mis fincas</h2><p className="mt-1 text-sm text-slate-500">Distribución del mes seleccionado.</p><div className="mt-5 overflow-x-auto"><table className="min-w-full text-sm"><thead className="border-b bg-slate-50 text-left"><tr><th className="p-3">Acto inseguro</th><th className="p-3 text-center">Abiertos</th><th className="p-3 text-center">Cerrados</th><th className="p-3 text-center">Total</th></tr></thead><tbody>{Object.entries(actos).map(([acto, conteo]) => <tr key={acto} className="border-b last:border-0"><td className="p-3 font-medium">{acto}</td><td className="p-3 text-center text-red-700">{conteo.abiertos}</td><td className="p-3 text-center text-green-700">{conteo.cerrados}</td><td className="p-3 text-center font-bold">{conteo.abiertos + conteo.cerrados}</td></tr>)}{Object.keys(actos).length === 0 && <tr><td colSpan={4} className="p-5 text-center text-slate-500">No hay análisis registrados para este mes.</td></tr>}</tbody></table></div></section>
    <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[#0F3D1F]">Detalle de análisis</h2><div className="mt-5 overflow-x-auto"><table className="min-w-full text-sm"><thead className="border-b bg-slate-50 text-left"><tr><th className="p-3">Fecha</th><th className="p-3">Consecutivo</th><th className="p-3">Acto</th><th className="p-3">Estado</th><th className="p-3">Acción</th></tr></thead><tbody>{detalles.map((detalle) => <tr key={detalle.id} className="border-b last:border-0"><td className="p-3">{detalle.fecha.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}</td><td className="p-3 font-semibold">{detalle.consecutivo || `Análisis #${detalle.id}`}</td><td className="p-3">{detalle.actoInseguro || "Sin acto"}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${detalle.estado === "CERRADO" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{detalle.estado === "CERRADO" ? "Cerrado" : "Abierto"}</span></td><td className="p-3"><Link href={`/vulnerabilidades/${detalle.id}`} className="font-semibold text-[#0F3D1F] underline">Ver análisis</Link></td></tr>)}{detalles.length === 0 && <tr><td colSpan={5} className="p-5 text-center text-slate-500">No hay detalles para este mes.</td></tr>}</tbody></table></div></section>
  </main>;
}

function Tarjeta({ titulo, valor, color = "text-[#0F3D1F]" }: { titulo: string; valor: number; color?: string }) { return <article className="rounded-xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{titulo}</p><p className={`mt-1 text-3xl font-bold ${color}`}>{valor}</p></article>; }
