import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tiposSimulacro } from "@/lib/simulacros";
import { esAnalistaSig } from "@/lib/permisosUsuarios";
import { fincasAsignadasAnalistaSig } from "@/lib/fincasAnalistaSig";

type SearchParams = Promise<{ anio?: string; mes?: string }>;
type Conteo = { informes: number; detectados: number; perdidos: number; reprogramados: number };
type Informe = { id: number; actividadId: number; finca: string; tipo: string; resultado: string; consecutivo: string | null; requiereSac: boolean; creadoPorCorreo: string; createdAt: Date; actividadSupervisor: { fechaPlaneada: Date; origenId: string | null }; solicitudAccion: { estado: string; actividadReprogramadaId: number | null; fechaReprogramacion: Date | null; fechaCierre: Date | null } | null };
type InformeClasificado = Informe & { esReprogramado: boolean };

function partesColombia(fecha = new Date()) { const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric" }).formatToParts(fecha); return Object.fromEntries(partes.map((parte) => [parte.type, parte.value])); }
function obtenerAnio(valor?: string) { const actual = Number(partesColombia().year); const anio = Number(valor); return Number.isInteger(anio) && anio >= 2020 && anio <= actual + 1 ? anio : actual; }
function obtenerMes(valor?: string) { const mes = Number(valor); return Number.isInteger(mes) && mes >= 1 && mes <= 12 ? mes : null; }
function mesColombia(fecha: Date) { return Number(new Intl.DateTimeFormat("en-CA", { month: "numeric", timeZone: "America/Bogota" }).format(fecha)); }
function nombreMes(anio: number, mes: number) { return new Intl.DateTimeFormat("es-CO", { month: "long", timeZone: "America/Bogota" }).format(new Date(Date.UTC(anio, mes - 1, 1, 5))); }
function etiquetaTipo(tipo: string) { return tipo.replace(/^SIMULACRO\s+/, "").replace("CONTAMINACION", "CONTAMINACIÓN"); }
function esPerdido(resultado: string) { return ["NO DETECTADO", "PERDIDO"].includes(String(resultado).trim().toUpperCase()); }

/** Un reprogramado es un nuevo informe del mismo tipo posterior a una pérdida pendiente de repetir. */
function clasificarInformes(informes: Informe[], idsReprogramadosSac: Set<number>) {
  const porFincaTipo = informes.reduce<Map<string, Informe[]>>((mapa, informe) => { const llave = `${informe.finca}::${informe.tipo}`; const registros = mapa.get(llave) || []; registros.push(informe); mapa.set(llave, registros); return mapa; }, new Map());
  const clasificados: InformeClasificado[] = [];
  for (const registros of porFincaTipo.values()) {
    let perdidaPendiente = false;
    for (const informe of registros.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id - b.id)) {
      const marcadoPorSac = idsReprogramadosSac.has(informe.actividadId) || String(informe.actividadSupervisor.origenId || "").startsWith("REPROGRAMACION-");
      const esReprogramado = marcadoPorSac || perdidaPendiente;
      clasificados.push({ ...informe, esReprogramado });
      if (esReprogramado) perdidaPendiente = esPerdido(informe.resultado);
      else if (esPerdido(informe.resultado)) perdidaPendiente = true;
    }
  }
  return clasificados;
}

function estadoSac(informe: InformeClasificado) {
  const sac = informe.solicitudAccion;
  if (!sac && informe.creadoPorCorreo === "historico@falconservice.local") return { texto: "Histórico importado · SAC gestionada en formato anterior", clase: "bg-sky-100 text-sky-800" };
  if (!sac && !informe.requiereSac) return { texto: "No requiere SAC", clase: "bg-slate-100 text-slate-700" };
  if (!sac) return { texto: "Pendiente SAC y reprogramación", clase: "bg-red-100 text-red-800" };
  if (sac.estado === "CERRADA" || sac.fechaCierre) return { texto: "SAC cerrada tras reprogramación", clase: "bg-green-100 text-green-800" };
  if (sac.actividadReprogramadaId) return { texto: "SAC en seguimiento · reprogramada", clase: "bg-amber-100 text-amber-900" };
  return { texto: "SAC creada · pendiente reprogramar", clase: "bg-amber-100 text-amber-900" };
}

export default async function MetricasSimulacrosPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);
  const rol = String(session?.user?.role || "");
  const usuario = session?.user?.email ? await prisma.usuario.findUnique({ where: { email: session.user.email }, select: { nombre: true, cargo: true, fincaEAI: true } }) : null;
  const esJefatura = ["ADMIN", "JEFE_SEG", "DIRECTOR_SEG"].includes(rol);
  const esAnalistaConFinca = esAnalistaSig(usuario?.cargo) && Boolean(usuario?.fincaEAI);
  if (!esJefatura && !esAnalistaConFinca) redirect("/dashboard");

  const params = await searchParams;
  const anioActual = Number(partesColombia().year);
  const anio = obtenerAnio(params.anio);
  const mesFiltro = obtenerMes(params.mes);
  const inicioAnio = new Date(Date.UTC(anio, 0, 1, 5));
  const finAnio = new Date(Date.UTC(anio + 1, 0, 1, 5));
  const fincasAnalista = fincasAsignadasAnalistaSig(usuario);
  const alcanceFinca = esAnalistaConFinca ? { finca: { in: fincasAnalista } } : {};

  const informes = await prisma.simulacroActividad.findMany({ where: { ...alcanceFinca, createdAt: { gte: inicioAnio, lt: finAnio } }, include: { actividadSupervisor: { select: { fechaPlaneada: true, origenId: true } }, solicitudAccion: { select: { estado: true, actividadReprogramadaId: true, fechaReprogramacion: true, fechaCierre: true } } }, orderBy: [{ finca: "asc" }, { createdAt: "asc" }, { id: "asc" }] }) as Informe[];
  const sacsConReprogramacion = informes.length ? await prisma.solicitudAccion.findMany({ where: { actividadReprogramadaId: { in: informes.map((informe) => informe.actividadId) } }, select: { actividadReprogramadaId: true } }) : [];
  const idsReprogramadosSac = new Set(sacsConReprogramacion.map((sac) => sac.actividadReprogramadaId).filter((id): id is number => id !== null));
  const clasificados = clasificarInformes(informes, idsReprogramadosSac);
  const iniciales = clasificados.filter((informe) => !informe.esReprogramado);
  const detalle = mesFiltro ? clasificados.filter((informe) => mesColombia(informe.createdAt) === mesFiltro) : clasificados;
  const perdidosIniciales = iniciales.filter((informe) => esPerdido(informe.resultado));
  const fincas = [...new Set(clasificados.map((informe) => informe.finca))];

  const porMesTipo = new Map<string, Conteo>();
  for (const informe of clasificados) { const llave = `${mesColombia(informe.createdAt)}-${informe.tipo}`; const conteo = porMesTipo.get(llave) || { informes: 0, detectados: 0, perdidos: 0, reprogramados: 0 }; conteo.informes += 1; if (informe.resultado === "DETECTADO") conteo.detectados += 1; if (esPerdido(informe.resultado)) conteo.perdidos += 1; if (informe.esReprogramado) conteo.reprogramados += 1; porMesTipo.set(llave, conteo); }
  const porFinca = new Map<string, Conteo>();
  for (const informe of clasificados) { const conteo = porFinca.get(informe.finca) || { informes: 0, detectados: 0, perdidos: 0, reprogramados: 0 }; conteo.informes += 1; if (!informe.esReprogramado && informe.resultado === "DETECTADO") conteo.detectados += 1; if (!informe.esReprogramado && esPerdido(informe.resultado)) conteo.perdidos += 1; if (informe.esReprogramado) conteo.reprogramados += 1; porFinca.set(informe.finca, conteo); }
  const ranking = fincas.map((finca) => { const conteo = porFinca.get(finca) || { informes: 0, detectados: 0, perdidos: 0, reprogramados: 0 }; const inicialesRealizados = conteo.informes - conteo.reprogramados; return { finca, ...conteo, inicialesRealizados, porcentajeEfectividad: inicialesRealizados ? Math.round((conteo.detectados / inicialesRealizados) * 100) : 0 }; }).sort((a, b) => a.porcentajeEfectividad - b.porcentajeEfectividad || b.perdidos - a.perdidos || a.finca.localeCompare(b.finca));
  const fincaMenorEfectividad = ranking[0]; const fincaMasEfectiva = [...ranking].sort((a, b) => b.porcentajeEfectividad - a.porcentajeEfectividad || b.detectados - a.detectados || a.finca.localeCompare(b.finca))[0];
  const sacPendientes = perdidosIniciales.filter((informe) => informe.requiereSac && !informe.solicitudAccion && informe.creadoPorCorreo !== "historico@falconservice.local").length;
  const mesesDetalle = mesFiltro ? [mesFiltro] : Array.from({ length: 12 }, (_, indice) => indice + 1);
  const etiquetaDetalle = mesFiltro ? `Detalle de ${nombreMes(anio, mesFiltro)} de ${anio}` : `Vista general de ${anio}`;

  return <main className="mx-auto max-w-7xl space-y-6 p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold text-[#0F3D1F]">Métricas de simulacros</h1><p className="mt-1 capitalize text-slate-600">{etiquetaDetalle}. {esAnalistaConFinca ? `Indicadores exclusivos de las fincas ${fincasAnalista.join(" y ")}.` : "Los conteos se calculan exclusivamente con los informes cargados."}</p></div><form action="/simulacros/metricas" className="flex flex-wrap items-end gap-2 rounded-xl border bg-white p-3 shadow-sm"><label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Año<input name="anio" type="number" min="2020" max={String(anioActual + 1)} defaultValue={anio} className="w-28 rounded-lg border p-2 font-normal" /></label><label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Mes<select name="mes" defaultValue={mesFiltro ? String(mesFiltro) : ""} className="rounded-lg border p-2 font-normal"><option value="">Todo el año</option>{Array.from({ length: 12 }, (_, indice) => indice + 1).map((mes) => <option key={mes} value={mes} className="capitalize">{nombreMes(anio, mes)}</option>)}</select></label><button className="rounded-lg bg-[#0F3D1F] px-4 py-2 font-semibold text-white">Ver métricas</button></form></div>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><Tarjeta etiqueta="Meta inicial anual" valor={fincas.length * 8} /><Tarjeta etiqueta="Informes cargados" valor={clasificados.length} color="text-[#0F3D1F]" /><Tarjeta etiqueta="Iniciales evaluados" valor={iniciales.length} color="text-sky-700" /><Tarjeta etiqueta="Reprogramados" valor={clasificados.filter((informe) => informe.esReprogramado).length} color="text-amber-700" /><Tarjeta etiqueta="Perdidos iniciales" valor={perdidosIniciales.length} color="text-red-700" /></section>
    <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900"><strong>Fuente del indicador:</strong> se cuentan únicamente los informes de simulacro que ya existen en Falcon. La meta es de 8 simulacros iniciales por finca al año. Un informe se marca como reprogramado solo si corresponde al mismo tipo de un simulacro perdido previamente o si fue creado como reprogramación de una SAC.</section>
    <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[#0F3D1F]">Informes por mes y tipo de simulacro</h2><p className="mt-1 text-sm text-slate-500">Los resultados de esta tabla incluyen todos los informes realizados, incluso los reprogramados.</p><div className="mt-5 overflow-x-auto"><table className="min-w-full text-sm"><thead className="border-b bg-slate-50 text-left"><tr><th className="p-3">Mes</th><th className="p-3">Tipo</th><th className="p-3 text-center">Informes</th><th className="p-3 text-center">Detectados</th><th className="p-3 text-center">Perdidos</th><th className="p-3 text-center">Reprogramados</th></tr></thead><tbody>{mesesDetalle.flatMap((mes) => [...tiposSimulacro].map((tipo, indice) => { const conteo = porMesTipo.get(`${mes}-${tipo}`) || { informes: 0, detectados: 0, perdidos: 0, reprogramados: 0 }; return <tr key={`${mes}-${tipo}`} className="border-b last:border-0"><td className="p-3 capitalize">{indice === 0 ? nombreMes(anio, mes) : ""}</td><td className="p-3 font-medium">{etiquetaTipo(tipo)}</td><td className="p-3 text-center font-bold">{conteo.informes}</td><td className="p-3 text-center font-bold text-green-700">{conteo.detectados}</td><td className="p-3 text-center font-bold text-red-700">{conteo.perdidos}</td><td className="p-3 text-center text-amber-800">{conteo.reprogramados}</td></tr>; }))}</tbody></table></div></section>
    <div className="grid gap-6 xl:grid-cols-2"><section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[#0F3D1F]">{esAnalistaConFinca ? "Resultado de la finca" : "Ranking de fincas"}</h2><p className="mt-1 text-sm text-slate-500">Efectividad = detectados iniciales ÷ simulacros iniciales realizados. Los reprogramados no se incluyen en este porcentaje.</p><div className="mt-5 overflow-x-auto"><table className="min-w-full text-sm"><thead className="border-b bg-slate-50 text-left"><tr><th className="p-3">Finca</th><th className="p-3 text-center">Meta inicial</th><th className="p-3 text-center">Informes</th><th className="p-3 text-center">Reprogramados</th><th className="p-3 text-center">Detectados iniciales</th><th className="p-3 text-center">Perdidos iniciales</th><th className="p-3 text-center">Efectividad</th></tr></thead><tbody>{ranking.map((fila) => <tr key={fila.finca} className="border-b last:border-0"><td className="p-3 font-semibold">{fila.finca}</td><td className="p-3 text-center">8</td><td className="p-3 text-center font-bold">{fila.informes}</td><td className="p-3 text-center text-amber-800">{fila.reprogramados}</td><td className="p-3 text-center text-green-700">{fila.detectados}</td><td className="p-3 text-center font-bold text-red-700">{fila.perdidos}</td><td className="p-3 text-center font-bold text-[#0F3D1F]">{fila.porcentajeEfectividad}%</td></tr>)}{ranking.length === 0 && <tr><td colSpan={7} className="p-5 text-center text-slate-500">No hay informes de simulacro cargados en {anio}.</td></tr>}</tbody></table></div></section><section className="space-y-4 rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[#0F3D1F]">{esAnalistaConFinca ? "Lectura de resultados de la finca" : "Lectura de resultados anual"}</h2><Indicador titulo={esAnalistaConFinca ? "Efectividad de la finca" : "Finca con menor efectividad"} valor={fincaMenorEfectividad ? `${fincaMenorEfectividad.finca} · ${fincaMenorEfectividad.porcentajeEfectividad}% de efectividad` : "Sin datos"} clase="border-amber-200 bg-amber-50 text-amber-900" /><Indicador titulo={esAnalistaConFinca ? "Simulacros iniciales realizados" : "Finca más efectiva"} valor={fincaMasEfectiva ? (esAnalistaConFinca ? `${fincaMasEfectiva.inicialesRealizados} realizado(s)` : `${fincaMasEfectiva.finca} · ${fincaMasEfectiva.porcentajeEfectividad}% de efectividad`) : "Sin datos"} clase="border-green-200 bg-green-50 text-green-900" /><Indicador titulo="SAC pendientes vigentes" valor={`${sacPendientes} SAC`} clase="border-amber-200 bg-amber-50 text-amber-900" /></section></div>
    <section className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-[#0F3D1F]">Simulacros perdidos y trazabilidad de la SAC</h2><p className="mt-1 text-sm text-slate-500">Los históricos importados se identifican como gestionados bajo el formato anterior.</p></div><Link href="/simulacros" className="rounded border px-4 py-2 font-semibold">Ver simulacros</Link></div><div className="mt-5 overflow-x-auto"><table className="min-w-full text-sm"><thead className="border-b bg-slate-50 text-left"><tr><th className="p-3">Fecha</th><th className="p-3">Finca</th><th className="p-3">Tipo</th><th className="p-3">Consecutivo</th><th className="p-3">Clasificación</th><th className="p-3">Estado SAC / reprogramación</th><th className="p-3">Acción</th></tr></thead><tbody>{detalle.filter((informe) => esPerdido(informe.resultado)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map((informe) => { const estado = estadoSac(informe); return <tr key={informe.id} className="border-b last:border-0"><td className="p-3">{informe.createdAt.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}</td><td className="p-3 font-semibold">{informe.finca}</td><td className="p-3">{etiquetaTipo(informe.tipo)}</td><td className="p-3">{informe.consecutivo || `SIM-${informe.id}`}</td><td className="p-3"><span className={`rounded px-2 py-1 text-xs font-bold ${informe.esReprogramado ? "bg-amber-100 text-amber-900" : "bg-red-100 text-red-800"}`}>{informe.esReprogramado ? "Reprogramado" : "Inicial"}</span></td><td className="p-3"><span className={`inline-block rounded px-2 py-1 text-xs font-bold ${estado.clase}`}>{estado.texto}</span></td><td className="p-3"><Link href={`/simulacros/${informe.id}`} className="font-semibold text-[#0F3D1F] underline">Ver detalle</Link></td></tr>; })}{detalle.filter((informe) => esPerdido(informe.resultado)).length === 0 && <tr><td colSpan={7} className="p-5 text-center text-slate-500">No hay simulacros perdidos en este detalle.</td></tr>}</tbody></table></div></section>
  </main>;
}

function Tarjeta({ etiqueta, valor, color = "text-slate-900" }: { etiqueta: string; valor: number; color?: string }) { return <article className="rounded-xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{etiqueta}</p><p className={`mt-1 text-3xl font-bold ${color}`}>{valor}</p></article>; }
function Indicador({ titulo, valor, clase }: { titulo: string; valor: string; clase: string }) { return <article className={`rounded-xl border p-4 ${clase}`}><p className="text-sm font-semibold">{titulo}</p><p className="mt-1 text-lg font-bold">{valor}</p></article>; }
