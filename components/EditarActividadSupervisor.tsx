"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

import { areasActividad, fincasActividad, tiposActividad } from "@/lib/actividadesSupervisores";

function fechaInputColombia(fecha: string) {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(fecha));
  const valor = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valor.year}-${valor.month}-${valor.day}T${valor.hour}:${valor.minute}`;
}

export default function EditarActividadSupervisor({ actividad, supervisores }: { actividad: { id: number; fechaPlaneada: string; finca: string; actividad: string; area: string | null; supervisorCorreo: string | null }; supervisores: Array<{ nombre: string; email: string }> }) {
  const [guardando, setGuardando] = useState(false);
  async function guardar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuardando(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch(`/api/actividades-supervisores/${actividad.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "actualizar", ...Object.fromEntries(form.entries()) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible actualizar la actividad");
      toast.success("Actividad actualizada correctamente");
      window.location.href = "/actividades-supervisores";
    } catch (error: any) {
      toast.error(error.message || "Error actualizando la actividad");
    } finally { setGuardando(false); }
  }
  return <div className="mx-auto max-w-3xl"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold text-[#0F3D1F]">Editar actividad</h1><p className="mt-1 text-slate-600">Actualice la programación o cualquier dato de la actividad.</p></div><Link href="/actividades-supervisores" className="rounded-lg border bg-white px-4 py-2 font-semibold hover:bg-slate-100">Cancelar</Link></div><form onSubmit={guardar} className="grid grid-cols-1 gap-4 rounded-xl border bg-white p-6 shadow-sm md:grid-cols-2"><label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Fecha planeada<input name="fechaPlaneada" type="datetime-local" defaultValue={fechaInputColombia(actividad.fechaPlaneada)} required className="rounded-lg border p-3 font-normal" /></label><label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Finca<select name="finca" defaultValue={actividad.finca} required className="rounded-lg border p-3 font-normal">{fincasActividad.map((finca) => <option key={finca} value={finca}>{finca}</option>)}</select></label><label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Actividad<select name="actividad" defaultValue={actividad.actividad} required className="rounded-lg border p-3 font-normal">{tiposActividad.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}</select></label><label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Área<select name="area" defaultValue={actividad.area || ""} required className="rounded-lg border p-3 font-normal">{areasActividad.map((area) => <option key={area} value={area}>{area}</option>)}</select></label><label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Supervisor<select name="supervisorCorreo" defaultValue={actividad.supervisorCorreo || ""} className="rounded-lg border p-3 font-normal"><option value="">Pendiente por asignar</option>{supervisores.map((supervisor) => <option key={supervisor.email} value={supervisor.email}>{supervisor.nombre}</option>)}</select></label><button disabled={guardando} className="self-end rounded-lg bg-[#0F3D1F] p-3 font-semibold text-white hover:bg-[#14532d] disabled:bg-slate-400">{guardando ? "Guardando..." : "Guardar cambios"}</button></form></div>;
}
