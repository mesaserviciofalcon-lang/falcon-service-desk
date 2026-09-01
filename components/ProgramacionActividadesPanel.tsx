"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";

type Actividad = { id: number; fechaPlaneada: string; finca: string; actividad: string; area: string | null; estado: string; programadoPorAnalistaAt: string | null };
type Ocupada = { id: number; finca: string; fechaPlaneada: string };

function fechaColombia(fecha: string) {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(fecha));
  const valor = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valor.year}-${valor.month}-${valor.day}`;
}

function etiquetaFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${fecha}T05:00:00.000Z`));
}

function diasDelMes(fecha: string) {
  const [ano, mes] = fecha.split("-").map(Number);
  return Array.from({ length: new Date(Date.UTC(ano, mes, 0)).getUTCDate() }, (_, indice) => `${ano}-${String(mes).padStart(2, "0")}-${String(indice + 1).padStart(2, "0")}`);
}

export default function ProgramacionActividadesPanel({ ventanaAbierta, etiquetaMes, actividades, ocupadas, areas }: { ventanaAbierta: boolean; etiquetaMes: string; actividades: Actividad[]; ocupadas: Ocupada[]; areas: string[] }) {
  const [valores, setValores] = useState<Record<number, { fechaPlaneada: string; area: string }>>(() => Object.fromEntries(actividades.map((actividad) => [actividad.id, { fechaPlaneada: fechaColombia(actividad.fechaPlaneada), area: actividad.area || "" }])));
  const [guardando, setGuardando] = useState<number | null>(null);
  const dias = useMemo(() => actividades[0] ? diasDelMes(fechaColombia(actividades[0].fechaPlaneada)) : [], [actividades]);

  function fechaEstaOcupada(actividad: Actividad, fecha: string) {
    if (fecha === fechaColombia(actividad.fechaPlaneada)) return false;
    return ocupadas.some((ocupada) => ocupada.id !== actividad.id && ocupada.finca !== actividad.finca && fechaColombia(ocupada.fechaPlaneada) === fecha);
  }

  async function guardar(actividad: Actividad) {
    const valor = valores[actividad.id];
    if (!valor?.area || !valor.fechaPlaneada) return toast.error("Seleccione área y fecha planeada");
    if (fechaEstaOcupada(actividad, valor.fechaPlaneada)) return toast.error("La fecha seleccionada está ocupada por otra finca");
    setGuardando(actividad.id);
    try {
      const response = await fetch(`/api/actividades-supervisores/${actividad.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "programarAnalista", ...valor }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible guardar la programación");
      toast.success("Programación guardada");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "No fue posible guardar la programación");
    } finally { setGuardando(null); }
  }

  return <main className="mx-auto max-w-6xl p-6"><h1 className="text-3xl font-bold text-[#0F3D1F]">Programación de actividades</h1><p className="mt-1 text-slate-600">Actividades estimadas para <strong className="capitalize">{etiquetaMes}</strong>. Puede modificar únicamente el área y la fecha planeada.</p><div className={`mt-5 rounded-xl border p-4 ${ventanaAbierta ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-slate-50"}`}><strong>{ventanaAbierta ? "Ventana de programación habilitada" : "Ventana de programación cerrada"}</strong><p className="mt-1 text-sm">La programación está disponible desde el día 25 hasta el último día del mes anterior. Si no realiza ajustes, se conservará la fecha y área definidas por Seguridad.</p></div>{actividades.length === 0 ? <div className="mt-6 rounded-xl border bg-white p-6 text-slate-500">No hay actividades de su finca programadas para este mes.</div> : <div className="mt-6 grid gap-4 md:grid-cols-2">{actividades.map((actividad) => { const valor = valores[actividad.id]; return <section key={actividad.id} className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-[#0F3D1F]">{actividad.actividad}</h2><p className="mt-1 text-sm"><strong>Finca:</strong> {actividad.finca}</p></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${actividad.programadoPorAnalistaAt ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}>{actividad.programadoPorAnalistaAt ? "Programada" : "Pendiente"}</span></div><label className="mt-4 flex flex-col gap-1 text-sm font-semibold">Área<select disabled={!ventanaAbierta} value={valor?.area || ""} onChange={(event) => setValores((actual) => ({ ...actual, [actividad.id]: { ...actual[actividad.id], area: event.target.value } }))} className="rounded-lg border p-3 font-normal disabled:bg-slate-100"><option value="">Seleccione área</option>{areas.map((area) => <option key={area} value={area}>{area}</option>)}</select></label><label className="mt-3 flex flex-col gap-1 text-sm font-semibold">Fecha planeada<select disabled={!ventanaAbierta} value={valor?.fechaPlaneada || ""} onChange={(event) => setValores((actual) => ({ ...actual, [actividad.id]: { ...actual[actividad.id], fechaPlaneada: event.target.value } }))} className="rounded-lg border p-3 font-normal disabled:bg-slate-100">{dias.map((dia) => { const ocupada = fechaEstaOcupada(actividad, dia); return <option key={dia} value={dia} disabled={ocupada} title={ocupada ? "Fecha ocupada" : "Fecha disponible"}>{etiquetaFecha(dia)}{ocupada ? " — fecha ocupada" : ""}</option>; })}</select></label><p className="mt-2 text-xs text-slate-500">Las fechas ocupadas por otra finca aparecen deshabilitadas y marcadas como “fecha ocupada”.</p><button type="button" disabled={!ventanaAbierta || guardando === actividad.id} onClick={() => guardar(actividad)} className="mt-4 rounded-lg bg-[#0F3D1F] px-4 py-3 font-semibold text-white disabled:bg-slate-400">{guardando === actividad.id ? "Guardando..." : "Guardar programación"}</button></section>; })}</div>}</main>;
}
