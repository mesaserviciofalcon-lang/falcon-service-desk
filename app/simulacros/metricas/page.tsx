import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tiposSimulacro } from "@/lib/simulacros";

type SearchParams = Promise<{ anio?: string; mes?: string }>;
type Conteo = { programados: number; detectados: number; perdidos: number };

function partesColombia(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric" }).formatToParts(fecha);
  return Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
}

function obtenerAnio(valor?: string) {
  const actual = Number(partesColombia().year);
  const anio = Number(valor);
  return Number.isInteger(anio) && anio >= 2020 && anio <= actual + 1 ? anio : actual;
}

function obtenerMes(valor?: string) {
  const mes = Number(valor);
  return Number.isInteger(mes) && mes >= 1 && mes <= 12 ? mes : null;
}

function nombreMes(anio: number, mes: number) {
  return new Intl.DateTimeFormat("es-CO", { month: "long", timeZone: "America/Bogota" }).format(new Date(Date.UTC(anio, mes - 1, 1, 5)));
}

function mesColombia(fecha: Date) {
  return Number(new Intl.DateTimeFormat("en-CA", { month: "numeric", timeZone: "America/Bogota" }).format(fecha));
}

function etiquetaTipo(tipo: string) {
  return tipo.replace(/^SIMULACRO\s+/, "").replace("CONTAMINACION", "CONTAMINACIÓN");
}

function esPerdido(resultado: string) {
  return String(resultado).trim().toUpperCase() === "NO DETECTADO";
}

function estadoSac(sac: { estado: string; actividadReprogramadaId: number | null; fechaReprogramacion: Date | null; fechaCierre: Date | null } | null, requiereSac: boolean, esHistorico: boolean) {
  if (!sac && esHistorico) return { texto: "Histórico importado · SAC gestionada en formato anterior", clase: "bg-sky-100 text-sky-800" };
  if (!sac && !requiereSac) return { texto: "No requiere SAC", clase: "bg-slate-100 text-slate-700" };
  if (!sac) return { texto: "Pendiente SAC y reprogramación", clase: "bg-red-100 text-red-800" };
  if (sac.estado === "CERRADA" || sac.fechaCierre) return { texto: "SAC cerrada tras reprogramación", clase: "bg-green-100 text-green-800" };
  if (sac.actividadReprogramadaId) {
    const fecha = sac.fechaReprogramacion?.toLocaleDateString("es-CO", { timeZone: "America/Bogota" });
    return { texto: `SAC en seguimiento · reprogramada${fecha ? ` para ${fecha}` : ""}`, clase: "bg-amber-100 text-amber-900" };
  }
  return { texto: "SAC creada · pendiente reprogramar", clase: "bg-amber-100 text-amber-900" };
}

export default async function MetricasSimulacrosPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);
  const rol = String(session?.user?.role || "");
  if (!["ADMIN", "JEFE_SEG", "DIRECTOR_SEG"].includes(rol)) redirect("/dashboard");

  const params = await searchParams;
  const anio = obtenerAnio(params.anio);
  const mesFiltro = obtenerMes(params.mes);
  const inicio = new Date(Date.UTC(anio, (mesFiltro || 1) - 1, 1, 5));
  const fin = mesFiltro ? new Date(Date.UTC(anio, mesFiltro, 1, 5)) : new Date(Date.UTC(anio + 1, 0, 1, 5));
  const etiquetaPeriodo = mesFiltro ? `${nombreMes(anio, mesFiltro)} de ${anio}` : `todo ${anio}`;
  const meses = mesFiltro ? [mesFiltro] : Array.from({ length: 12 }, (_, indice) => indice + 1);

  const candidatos = await prisma.actividadSupervisor.findMany({
    where: { actividad: { in: [...tiposSimulacro] }, fechaPlaneada: { gte: inicio, lt: fin } },
    select: { id: true, origenId: true, fechaPlaneada: true, finca: true, actividad: true },
  });
  const reprogramacionesSac = candidatos.length ? await prisma.solicitudAccion.findMany({ where: { actividadReprogramadaId: { in: candidatos.map((actividad) => actividad.id) } }, select: { actividadReprogramadaId: true } }) : [];
  const idsReprogramados = new Set(reprogramacionesSac.map((sac) => sac.actividadReprogramadaId).filter((id): id is number => id !== null));
  const programados = candidatos.filter((actividad) => !idsReprogramados.has(actividad.id) && !String(actividad.origenId || "").startsWith("REPROGRAMACION-"));
  const informes = programados.length ? await prisma.simulacroActividad.findMany({
    where: { actividadId: { in: programados.map((actividad) => actividad.id) } },
    include: { solicitudAccion: { select: { estado: true, actividadReprogramadaId: true, fechaReprogramacion: true, fechaCierre: true } } },
  }) : [];
  const programadoPorId = new Map(programados.map((actividad) => [actividad.id, actividad]));
  const informesPorActividad = new Map(informes.map((informe) => [informe.actividadId, informe]));

  const resumenMesTipo = new Map<string, Conteo>();
  const resumenFinca = new Map<string, Conteo>();
  for (const actividad of programados) {
    const informe = informesPorActividad.get(actividad.id);
    const acumular = (mapa: Map<string, Conteo>, llave: string) => {
      const conteo = mapa.get(llave) || { programados: 0, detectados: 0, perdidos: 0 };
      conteo.programados += 1;
      if (informe?.resultado === "DETECTADO") conteo.detectados += 1;
      if (informe && esPerdido(informe.resultado)) conteo.perdidos += 1;
      mapa.set(llave, conteo);
    };
    acumular(resumenMesTipo, `${mesColombia(actividad.fechaPlaneada)}-${actividad.actividad}`);
    acumular(resumenFinca, actividad.finca);
  }

  const rankingFincas = Array.from(resumenFinca.entries()).map(([finca, conteo]) => ({ finca, ...conteo, porcentajePerdida: conteo.programados ? Math.round((conteo.perdidos / conteo.programados) * 100) : 0 })).sort((a, b) => b.perdidos - a.perdidos || b.porcentajePerdida - a.porcentajePerdida || a.finca.localeCompare(b.finca));
  const fincaMasPierde = rankingFincas[0];
  const fincaMasAlineada = [...rankingFincas].sort((a, b) => a.porcentajePerdida - b.porcentajePerdida || b.programados - a.programados || a.finca.localeCompare(b.finca))[0];
  const perdidos = informes.filter((informe) => esPerdido(informe.resultado)).map((informe) => ({ informe, actividad: programadoPorId.get(informe.actividadId)! })).sort((a, b) => b.actividad.fechaPlaneada.getTime() - a.actividad.fechaPlaneada.getTime());
  const sacPendientes = perdidos.filter(({ informe }) => informe.requiereSac && !informe.solicitudAccion).length;
  const sacsEnSeguimiento = perdidos.filter(({ informe }) => informe.solicitudAccion?.estado === "EN_SEGUIMIENTO").length;

  return <main className="mx-auto max-w-7xl space-y-6 p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold text-[#0F3D1F]">Métricas de simulacros</h1><p className="mt-1 capitalize text-slate-600">Vista general de {etiquetaPeriodo}: programación inicial, detección, pérdidas y trazabilidad de SAC.</p></div><form action="/simulacros/metricas" className="flex flex-wrap items-end gap-2 rounded-xl border bg-white p-3 shadow-sm"><label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Año<input name="anio" type="number" min="2020" max={String(Number(partesColombia().year) + 1)} defaultValue={anio} className="w-28 rounded-lg border p-2 font-normal" /></label><label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Mes<select name="mes" defaultValue={mesFiltro ? String(mesFiltro) : ""} className="rounded-lg border p-2 font-normal"><option value="">Todo el año</option>{Array.from({ length: 12 }, (_, indice) => indice + 1).map((mes) => <option key={mes} value={mes} className="capitalize">{nombreMes(anio, mes)}</option>)}</select></label><button className="rounded-lg bg-[#0F3D1F] px-4 py-2 font-semibold text-white">Ver métricas</button></form></div>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><Tarjeta etiqueta="Programados iniciales" valor={programados.length} /><Tarjeta etiqueta="Informes generados" valor={informes.length} color="text-[#0F3D1F]" /><Tarjeta etiqueta="Detectados" valor={informes.filter((informe) => informe.resultado === "DETECTADO").length} color="text-green-700" /><Tarjeta etiqueta="Perdidos / no detectados" valor={perdidos.length} color="text-red-700" /><Tarjeta etiqueta="SAC pendientes vigentes" valor={sacPendientes} color="text-red-700" /></section>
    <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900"><strong>Base del indicador:</strong> se cuentan únicamente los simulacros iniciales. Las reprogramaciones no aumentan el total programado ni alteran la tasa de pérdida. Como referencia, cada finca debe realizar 8 simulacros iniciales al año: 4 tipos, uno por semestre.</section>
    <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[#0F3D1F]">Cumplimiento por mes y tipo de simulacro</h2><p className="mt-1 text-sm text-slate-500">Cada fila muestra: <strong>programados iniciales / detectados / perdidos</strong>.</p><div className="mt-5 overflow-x-auto"><table className="min-w-full text-sm"><thead className="border-b bg-slate-50 text-left"><tr><th className="p-3">Mes</th><th className="p-3">Tipo</th><th className="p-3 text-center">Iniciales</th><th className="p-3 text-center">Detectados</th><th className="p-3 text-center">Perdidos</th></tr></thead><tbody>{meses.flatMap((mes) => [...tiposSimulacro].map((tipo, indice) => { const conteo = resumenMesTipo.get(`${mes}-${tipo}`) || { programados: 0, detectados: 0, perdidos: 0 }; return <tr key={`${mes}-${tipo}`} className="border-b last:border-0"><td className="p-3 capitalize">{indice === 0 ? nombreMes(anio, mes) : ""}</td><td className="p-3 font-medium">{etiquetaTipo(tipo)}</td><td className="p-3 text-center">{conteo.programados}</td><td className="p-3 text-center font-bold text-green-700">{conteo.detectados}</td><td className="p-3 text-center font-bold text-red-700">{conteo.perdidos}</td></tr>; }))}</tbody></table></div></section>
    <div className="grid gap-6 xl:grid-cols-2"><section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[#0F3D1F]">Ranking de fincas</h2><p className="mt-1 text-sm text-slate-500">La tasa se calcula únicamente contra los simulacros iniciales del período.</p><div className="mt-5 overflow-x-auto"><table className="min-w-full text-sm"><thead className="border-b bg-slate-50 text-left"><tr><th className="p-3">Finca</th><th className="p-3 text-center">Iniciales</th><th className="p-3 text-center">Detectados</th><th className="p-3 text-center">Perdidos</th><th className="p-3 text-center">Tasa pérdida</th></tr></thead><tbody>{rankingFincas.map((fila) => <tr key={fila.finca} className="border-b last:border-0"><td className="p-3 font-semibold">{fila.finca}</td><td className="p-3 text-center">{fila.programados}</td><td className="p-3 text-center text-green-700">{fila.detectados}</td><td className="p-3 text-center font-bold text-red-700">{fila.perdidos}</td><td className="p-3 text-center">{fila.porcentajePerdida}%</td></tr>)}{rankingFincas.length === 0 && <tr><td colSpan={5} className="p-5 text-center text-slate-500">No hay simulacros iniciales programados en este período.</td></tr>}</tbody></table></div></section><section className="space-y-4 rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[#0F3D1F]">Lectura de resultados</h2><Indicador titulo="Finca con más pérdidas" valor={fincaMasPierde ? `${fincaMasPierde.finca} · ${fincaMasPierde.perdidos} perdido(s)` : "Sin datos"} clase="border-red-200 bg-red-50 text-red-900" /><Indicador titulo="Finca más alineada con Seguridad" valor={fincaMasAlineada ? `${fincaMasAlineada.finca} · ${fincaMasAlineada.porcentajePerdida}% de pérdida` : "Sin datos"} clase="border-green-200 bg-green-50 text-green-900" /><Indicador titulo="SAC en seguimiento" valor={`${sacsEnSeguimiento} SAC`} clase="border-amber-200 bg-amber-50 text-amber-900" /><p className="text-xs text-slate-500">La finca más alineada se define por la menor tasa de pérdida entre los simulacros iniciales del período seleccionado.</p></section></div>
    <section className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-[#0F3D1F]">Simulacros perdidos y trazabilidad de la SAC</h2><p className="mt-1 text-sm text-slate-500">Los históricos importados muestran la constancia de que su SAC fue gestionada en el formato anterior.</p></div><Link href="/simulacros" className="rounded border px-4 py-2 font-semibold">Ver simulacros</Link></div><div className="mt-5 overflow-x-auto"><table className="min-w-full text-sm"><thead className="border-b bg-slate-50 text-left"><tr><th className="p-3">Fecha</th><th className="p-3">Finca</th><th className="p-3">Tipo</th><th className="p-3">Consecutivo</th><th className="p-3">Estado SAC / reprogramación</th><th className="p-3">Acción</th></tr></thead><tbody>{perdidos.map(({ informe, actividad }) => { const estado = estadoSac(informe.solicitudAccion, informe.requiereSac, informe.creadoPorCorreo === "historico@falconservice.local"); return <tr key={informe.id} className="border-b last:border-0"><td className="p-3">{actividad.fechaPlaneada.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}</td><td className="p-3 font-semibold">{actividad.finca}</td><td className="p-3">{etiquetaTipo(informe.tipo)}</td><td className="p-3">{informe.consecutivo || `SIM-${informe.id}`}</td><td className="p-3"><span className={`inline-block rounded px-2 py-1 text-xs font-bold ${estado.clase}`}>{estado.texto}</span></td><td className="p-3"><Link href={`/simulacros/${informe.id}`} className="font-semibold text-[#0F3D1F] underline">Ver detalle</Link></td></tr>; })}{perdidos.length === 0 && <tr><td colSpan={6} className="p-5 text-center text-slate-500">No hay simulacros perdidos en este período.</td></tr>}</tbody></table></div></section>
  </main>;
}

function Tarjeta({ etiqueta, valor, color = "text-slate-900" }: { etiqueta: string; valor: number; color?: string }) {
  return <article className="rounded-xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{etiqueta}</p><p className={`mt-1 text-3xl font-bold ${color}`}>{valor}</p></article>;
}

function Indicador({ titulo, valor, clase }: { titulo: string; valor: string; clase: string }) {
  return <article className={`rounded-xl border p-4 ${clase}`}><p className="text-sm font-semibold">{titulo}</p><p className="mt-1 text-lg font-bold">{valor}</p></article>;
}
