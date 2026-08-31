"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

type Actividad = {
  id: number;
  fechaPlaneada: string;
  finca: string;
  actividad: string;
  area: string | null;
  supervisorNombre: string | null;
  supervisorCorreo: string | null;
  estado: string;
};

type Supervisor = { nombre: string; email: string };
type Catalogo = { tipo: string; valor: string };

const etiquetaEstado: Record<string, string> = {
  PENDIENTE_ASIGNAR: "Pendiente por asignar",
  ASIGNADO: "Asignado",
  TERMINADO: "Terminado",
};

function fechaLocal(fecha: string) {
  const partes = new Intl.DateTimeFormat("es-CO", {
    weekday: "long", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota",
  }).formatToParts(new Date(fecha));
  const valor = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valor.weekday} ${valor.day} de ${String(valor.month || "").replace(".", "")} de ${valor.year} · ${valor.hour}:${valor.minute} ${valor.dayPeriod || ""}`.trim();
}

function fechaInput(fecha: Date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(fecha);
  const valor = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valor.year}-${valor.month}-${valor.day}`;
}

function mesColombia(fecha: string) {
  return fechaInput(new Date(fecha)).slice(0, 7);
}

export default function ActividadesSupervisoresPanel({
  actividades,
  supervisores,
  catalogos,
  puedeAdministrar,
}: {
  actividades: Actividad[];
  supervisores: Supervisor[];
  catalogos: Catalogo[];
  puedeAdministrar: boolean;
}) {
  const [mostrarTerminadas, setMostrarTerminadas] = useState(false);
  const [mes, setMes] = useState(() => fechaInput(new Date()).slice(0, 7));
  const [formulario, setFormulario] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [catalogoAbierto, setCatalogoAbierto] = useState(false);
  const [nuevoCatalogo, setNuevoCatalogo] = useState({ tipo: "AREA", valor: "" });
  const fincas = catalogos.filter((item) => item.tipo === "FINCA").map((item) => item.valor);
  const tipos = catalogos.filter((item) => item.tipo === "ACTIVIDAD").map((item) => item.valor);
  const areas = catalogos.filter((item) => item.tipo === "AREA").map((item) => item.valor);
  const visibles = useMemo(
    () => actividades.filter((actividad) =>
      (mostrarTerminadas || actividad.estado !== "TERMINADO") && mesColombia(actividad.fechaPlaneada) === mes
    ),
    [actividades, mes, mostrarTerminadas]
  );

  async function crearActividad(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setGuardando(true);
    try {
      const response = await fetch("/api/actividades-supervisores", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible crear la actividad");
      toast.success("Actividad creada correctamente");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Error creando actividad");
    } finally {
      setGuardando(false);
    }
  }

  async function agregarCatalogo(event: React.FormEvent) {
    event.preventDefault();
    try {
      const response = await fetch("/api/actividades-supervisores/catalogos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nuevoCatalogo) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible agregar la opción");
      toast.success("Opción agregada");
      setNuevoCatalogo({ tipo: nuevoCatalogo.tipo, valor: "" });
      window.location.reload();
    } catch (error: any) { toast.error(error.message || "No fue posible agregar la opción"); }
  }

  async function asignar(id: number, supervisorCorreo: string) {
    if (!supervisorCorreo) return;
    try {
      const response = await fetch(`/api/actividades-supervisores/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "asignar", supervisorCorreo }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible asignar");
      toast.success("Actividad asignada");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Error asignando actividad");
    }
  }

  async function eliminar(id: number, nombreActividad: string) {
    if (!window.confirm(`¿Eliminar la actividad "${nombreActividad}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      const response = await fetch(`/api/actividades-supervisores/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible eliminar la actividad");
      toast.success("Actividad eliminada correctamente");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Error eliminando la actividad");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#0F3D1F]">Actividades de supervisores</h1>
          <p className="mt-1 text-slate-600">Las actividades cerradas desaparecen de la vista principal.</p>
        </div>
        {puedeAdministrar && <div className="flex gap-2"><button onClick={() => setCatalogoAbierto(!catalogoAbierto)} className="rounded-lg border bg-white px-4 py-2 font-semibold">Administrar listas</button><button onClick={() => setFormulario(!formulario)} className="rounded-lg bg-[#0F3D1F] px-4 py-2 font-semibold text-white hover:bg-[#14532d]">{formulario ? "Cancelar" : "Nueva actividad"}</button></div>}
      </div>

      {catalogoAbierto && <form onSubmit={agregarCatalogo} className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-5 shadow-sm"><label className="flex flex-col gap-1 text-sm font-semibold">Lista<select value={nuevoCatalogo.tipo} onChange={(e) => setNuevoCatalogo((actual) => ({ ...actual, tipo: e.target.value }))} className="rounded border p-3 font-normal"><option value="AREA">Áreas</option><option value="ACTIVIDAD">Actividades</option><option value="FINCA">Fincas</option></select></label><label className="flex min-w-64 flex-1 flex-col gap-1 text-sm font-semibold">Nueva opción<input required value={nuevoCatalogo.valor} onChange={(e) => setNuevoCatalogo((actual) => ({ ...actual, valor: e.target.value }))} className="rounded border p-3 font-normal" placeholder="Escriba el nombre" /></label><button className="rounded-lg bg-[#0F3D1F] px-4 py-3 font-semibold text-white">Agregar</button></form>}

      {formulario && (
        <form onSubmit={crearActividad} className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-5 shadow-sm md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Fecha planeada<input name="fechaPlaneada" type="datetime-local" required className="rounded-lg border p-3 font-normal" /></label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Finca<select name="finca" required defaultValue="" className="rounded-lg border p-3 font-normal"><option value="" disabled>Seleccione finca</option>{fincas.map((finca) => <option key={finca} value={finca}>{finca}</option>)}</select></label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Actividad<select name="actividad" required defaultValue="" className="rounded-lg border p-3 font-normal"><option value="" disabled>Seleccione actividad</option>{tipos.map((actividad) => <option key={actividad} value={actividad}>{actividad}</option>)}</select></label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Área<select name="area" required defaultValue="" className="rounded-lg border p-3 font-normal"><option value="" disabled>Seleccione área</option>{areas.map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Supervisor<select name="supervisorCorreo" className="rounded-lg border p-3 font-normal"><option value="">Pendiente por asignar</option>{supervisores.map((supervisor) => <option key={supervisor.email} value={supervisor.email}>{supervisor.nombre}</option>)}</select></label>
          <button disabled={guardando} className="rounded-lg bg-[#0F3D1F] p-3 font-semibold text-white disabled:bg-slate-400">{guardando ? "Guardando..." : "Crear actividad"}</button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4 shadow-sm">
        <label className="font-semibold text-slate-700">Mes <input value={mes} onChange={(event) => setMes(event.target.value)} type="month" className="ml-2 rounded border p-2" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mostrarTerminadas} onChange={(event) => setMostrarTerminadas(event.target.checked)} /> Mostrar cerradas</label>
        <span className="text-sm text-slate-500">{visibles.length} actividad(es)</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibles.map((actividad) => (
          <div key={actividad.id} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3"><p className="font-bold text-[#0F3D1F]">{actividad.actividad}</p><span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">{etiquetaEstado[actividad.estado]}</span></div>
            <p className="mt-3 text-sm"><strong>Fecha:</strong> {fechaLocal(actividad.fechaPlaneada)}</p>
            <p className="mt-1 text-sm"><strong>Finca:</strong> {actividad.finca}</p>
            <p className="mt-1 text-sm"><strong>Área:</strong> {actividad.area || "Sin área"}</p>
            <p className="mt-1 text-sm"><strong>Supervisor:</strong> {actividad.supervisorNombre || "Pendiente por asignar"}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/actividades-supervisores/${actividad.id}`} className="rounded-lg bg-[#0F3D1F] px-3 py-2 text-sm font-semibold text-white hover:bg-[#14532d]">Ver actividad</Link>
              {puedeAdministrar && <Link href={`/actividades-supervisores/${actividad.id}/editar`} className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100">Editar</Link>}
              {puedeAdministrar && <button type="button" onClick={() => eliminar(actividad.id, actividad.actividad)} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">Eliminar</button>}
              {puedeAdministrar && actividad.estado !== "TERMINADO" && <select defaultValue={actividad.supervisorCorreo || ""} onChange={(event) => asignar(actividad.id, event.target.value)} className="max-w-52 rounded-lg border p-2 text-sm"><option value="">Asignar supervisor</option>{supervisores.map((supervisor) => <option key={supervisor.email} value={supervisor.email}>{supervisor.nombre}</option>)}</select>}
            </div>
          </div>
        ))}
        {visibles.length === 0 && <div className="rounded-xl border border-dashed bg-white p-8 text-slate-500">No hay actividades pendientes para este mes.</div>}
      </div>
    </div>
  );
}
