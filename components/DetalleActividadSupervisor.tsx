"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import UploadButton from "@/components/uploadthing/UploadButton";

type Archivo = { url: string; nombre: string; tipo?: string };

function fechaActividad(fecha: string) {
  const partes = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).formatToParts(new Date(fecha));
  const valor = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valor.weekday} ${valor.day} de ${String(valor.month || "").replace(".", "")} de ${valor.year} · ${valor.hour}:${valor.minute} ${valor.dayPeriod || ""}`.trim();
}

export default function DetalleActividadSupervisor({
  actividad,
  puedeCerrar,
  esSimulacro = false,
}: {
  actividad: { id: number; fechaPlaneada: string; fechaCierre: string | null; finca: string; actividad: string; area: string | null; supervisorNombre: string | null; estado: string; observacionesCierre: string | null; evidencias: Archivo[] };
  puedeCerrar: boolean;
  esSimulacro?: boolean;
}) {
  const [observaciones, setObservaciones] = useState(actividad.observacionesCierre || "");
  const [evidencias, setEvidencias] = useState<Archivo[]>(actividad.evidencias || []);
  const [cerrando, setCerrando] = useState(false);
  const terminado = actividad.estado === "TERMINADO";

  async function cerrar() {
    if (esSimulacro) {
      window.location.href = `/actividades-supervisores/${actividad.id}/simulacro`;
      return;
    }
    setCerrando(true);
    try {
      const response = await fetch(`/api/actividades-supervisores/${actividad.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "cerrar", observacionesCierre: observaciones, evidencias }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible cerrar la actividad");
      toast.success("Actividad cerrada correctamente");
      window.location.href = "/actividades-supervisores";
    } catch (error: any) {
      toast.error(error.message || "Error cerrando actividad");
    } finally { setCerrando(false); }
  }

  return <div className="mx-auto max-w-3xl space-y-5">
    <div className="flex items-center justify-between gap-3"><div><h1 className="text-3xl font-bold text-[#0F3D1F]">{actividad.actividad}</h1><p className="mt-1 text-slate-600">{actividad.finca} · {actividad.area || "Sin área"}</p></div><Link href="/actividades-supervisores" className="rounded-lg border bg-white px-4 py-2 font-semibold">Volver</Link></div>
    <div className="rounded-xl border bg-white p-5 shadow-sm"><div className="grid gap-3 text-sm md:grid-cols-2"><p><strong>Fecha programada:</strong> {fechaActividad(actividad.fechaPlaneada)}</p><p><strong>Supervisor:</strong> {actividad.supervisorNombre || "Pendiente por asignar"}</p><p><strong>Estado:</strong> {terminado ? "Terminado" : "Asignado"}</p></div></div>
    {terminado ? <div className="rounded-xl border border-green-200 bg-green-50 p-5"><h2 className="font-bold text-green-950">Gestión cerrada</h2><p className="mt-2"><strong>Fecha ejecutada:</strong> {actividad.fechaCierre ? fechaActividad(actividad.fechaCierre) : "No registrada"}</p><p className="mt-2 whitespace-pre-wrap">{actividad.observacionesCierre}</p>{esSimulacro && <a href={`/actividades-supervisores/${actividad.id}/simulacro/pdf`} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded bg-[#0F3D1F] px-4 py-2 font-semibold text-white">Ver informe PDF</a>}<div className="mt-4 flex flex-col gap-2">{evidencias.map((archivo) => <a key={archivo.url} href={archivo.url} target="_blank" rel="noreferrer" className="rounded border bg-white p-3 text-[#0F3D1F] underline">{archivo.nombre}</a>)}</div></div> : puedeCerrar ? <div className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[#0F3D1F]">{esSimulacro ? "Diligenciar simulacro" : "Cerrar actividad"}</h2>{!esSimulacro && <><textarea value={observaciones} onChange={(event) => setObservaciones(event.target.value)} className="mt-4 min-h-32 w-full rounded-lg border p-3" placeholder="Describa la gestión realizada" /><div className="mt-4"><p className="mb-2 font-semibold">Evidencia de cierre</p><UploadButton allowedExtensions={["jpg", "jpeg", "png", "webp", "pdf"]} allowedExtensionsLabel="imágenes o PDF" onCompleteMany={(archivos: Archivo[]) => setEvidencias((actual) => [...actual, ...archivos])} /></div>{evidencias.length > 0 && <div className="mt-4 space-y-2">{evidencias.map((archivo) => <div key={archivo.url} className="flex items-center justify-between gap-3 rounded border bg-slate-50 p-2 text-sm"><span>{archivo.nombre}</span><button type="button" onClick={() => setEvidencias((actual) => actual.filter((item) => item.url !== archivo.url))} className="font-semibold text-red-700 hover:underline">Quitar adjunto</button></div>)}</div>}</>}<button disabled={cerrando} onClick={cerrar} className="mt-5 rounded-lg bg-[#0F3D1F] px-4 py-3 font-semibold text-white disabled:bg-gray-400">{cerrando ? "Cargando..." : esSimulacro ? "Crear informe de simulacro" : "Cerrar actividad"}</button></div> : <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950">Esta actividad está pendiente de gestión por el supervisor asignado.</div>}
  </div>;
}
