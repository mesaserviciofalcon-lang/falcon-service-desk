"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import UploadButton from "@/components/uploadthing/UploadButton";

type Archivo = { url: string; nombre: string; tipo?: string };
type Fila = { actividad: string; responsable: string; fecha: string };
const factores = ["Roles y Responsabilidades", "Capacitación y Competencia", "Estandarización", "Recursos", "Aseguramiento", "Factores Externos"];

export default function FormularioSac({ simulacro, responsableInicial }: { simulacro: { id: number; finca: string; tipo: string; conclusion: string; razonIncumplimiento: string | null; controlVulnerado: string | null }; responsableInicial: string }) {
  const [descripcionSituacion, setDescripcionSituacion] = useState(`Resultado del ${simulacro.tipo}: ${simulacro.conclusion}`);
  const [proceso, setProceso] = useState("Seguridad");
  const [sistemaGestion, setSistemaGestion] = useState("Seguridad Física");
  const [norma, setNorma] = useState(""); const [requisito, setRequisito] = useState("");
  const [correcciones, setCorrecciones] = useState<Fila[]>([{ actividad: "", responsable: "", fecha: "" }]);
  const [analisisCausa, setAnalisisCausa] = useState(simulacro.razonIncumplimiento || "");
  const [factoresCausa, setFactoresCausa] = useState<string[]>([]);
  const [planAccion, setPlanAccion] = useState<Fila[]>([{ actividad: "", responsable: "", fecha: "" }]);
  const [comentariosCierre, setComentariosCierre] = useState(""); const [eficacia, setEficacia] = useState(false); const [fechaReprogramacion, setFechaReprogramacion] = useState("");
  const [evidencias, setEvidencias] = useState<Archivo[]>([]); const [guardando, setGuardando] = useState(false);

  function filas(titulo: string, datos: Fila[], cambiar: (valor: Fila[]) => void) {
    const actualizar = (indice: number, campo: keyof Fila, valor: string) => cambiar(datos.map((fila, posicion) => posicion === indice ? { ...fila, [campo]: valor } : fila));
    return <div><p className="font-semibold">{titulo}</p>{datos.map((item, indice) => <div key={indice} className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]"><input placeholder="Actividad" value={item.actividad} onChange={(e) => actualizar(indice, "actividad", e.target.value)} className="rounded border p-3" /><input placeholder="Responsable" value={item.responsable} onChange={(e) => actualizar(indice, "responsable", e.target.value)} className="rounded border p-3" /><input type="date" value={item.fecha} onChange={(e) => actualizar(indice, "fecha", e.target.value)} className="rounded border p-3" /><button type="button" onClick={() => cambiar(datos.filter((_, posicion) => posicion !== indice))} disabled={datos.length === 1} className="rounded border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-40">Quitar</button></div>)}<button type="button" onClick={() => cambiar([...datos, { actividad: "", responsable: "", fecha: "" }])} className="mt-3 rounded border px-3 py-2 text-sm font-semibold">Agregar fila</button></div>;
  }

  async function guardar() {
    if (!evidencias.length) { toast.error("Debe adjuntar al menos una evidencia de cierre (foto o PDF)."); return; }
    setGuardando(true);
    try {
      const respuesta = await fetch(`/api/simulacros/${simulacro.id}/sac`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ descripcionSituacion, correcciones, analisisCausa, factoresCausa, planAccion, comentariosCierre, eficacia, fechaReprogramacion, proceso, sistemaGestion, norma, requisito, evidencias }) });
      const data = await respuesta.json(); if (!respuesta.ok) throw new Error(data.error || "No fue posible guardar la SAC");
      toast.success("SAC cerrada, reprogramación solicitada y correo enviado."); window.location.href = `/solicitudes-accion/${simulacro.id}`;
    } catch (error: any) { toast.error(error.message || "No fue posible guardar la SAC"); } finally { setGuardando(false); }
  }

  return <div className="mx-auto max-w-4xl space-y-5"><div><h1 className="text-3xl font-bold text-[#0F3D1F]">Solicitud de Acción Correctiva</h1><p className="mt-1 text-slate-600">Originada en {simulacro.tipo} · {simulacro.finca}</p></div><section className="space-y-4 rounded-xl border bg-white p-5 shadow-sm"><div className="grid gap-3 md:grid-cols-3"><label>Tipo de acción<input value="Correctiva" readOnly className="mt-1 w-full rounded border bg-slate-100 p-3" /></label><label>Responsable<input value={responsableInicial} readOnly className="mt-1 w-full rounded border bg-slate-100 p-3" /></label><label>Proceso<input value={proceso} onChange={(e) => setProceso(e.target.value)} className="mt-1 w-full rounded border p-3" /></label><label>Sistema de gestión<select value={sistemaGestion} onChange={(e) => setSistemaGestion(e.target.value)} className="mt-1 w-full rounded border p-3"><option>Seguridad Física</option><option>Calidad</option><option>Ambiental</option><option>Social</option><option>SST</option></select></label><label>Norma<input value={norma} onChange={(e) => setNorma(e.target.value)} className="mt-1 w-full rounded border p-3" /></label><label>Requisito<input value={requisito} onChange={(e) => setRequisito(e.target.value)} className="mt-1 w-full rounded border p-3" /></label></div><label className="block font-semibold">1. Descripción de la situación (hallazgo + evidencia objetiva)<textarea value={descripcionSituacion} onChange={(e) => setDescripcionSituacion(e.target.value)} className="mt-1 min-h-28 w-full rounded border p-3" /></label>{filas("2. Corrección (si aplica)", correcciones, setCorrecciones)}<label className="block font-semibold">3. Análisis de causa raíz<textarea value={analisisCausa} onChange={(e) => setAnalisisCausa(e.target.value)} className="mt-1 min-h-28 w-full rounded border p-3" /></label><div><p className="font-semibold">Factores de causa</p>{factores.map((factor) => <label key={factor} className="mt-2 flex gap-2 text-sm"><input type="checkbox" checked={factoresCausa.includes(factor)} onChange={(e) => setFactoresCausa((actual) => e.target.checked ? [...actual, factor] : actual.filter((item) => item !== factor))} />{factor}</label>)}</div>{filas("4. Plan de acción frente a la causa raíz", planAccion, setPlanAccion)}<label className="block font-semibold">Fecha solicitada para reprogramar el simulacro<input required type="date" value={fechaReprogramacion} onChange={(e) => setFechaReprogramacion(e.target.value)} className="mt-1 w-full rounded border p-3" /></label><label className="block font-semibold">5. Seguimiento / comentarios de cierre<textarea value={comentariosCierre} onChange={(e) => setComentariosCierre(e.target.value)} className="mt-1 min-h-24 w-full rounded border p-3" /></label><label className="flex gap-2 font-semibold"><input type="checkbox" checked={eficacia} onChange={(e) => setEficacia(e.target.checked)} />6. Las acciones emprendidas fueron eficaces y la SAC se cierra</label><div><p className="font-semibold">Evidencias del cierre (obligatorio)</p><UploadButton allowedExtensions={["jpg", "jpeg", "png", "webp", "pdf"]} allowedExtensionsLabel="imágenes o PDF" onCompleteMany={(archivos: Archivo[]) => setEvidencias((actual) => [...actual, ...archivos])} />{evidencias.map((archivo) => <div key={archivo.url} className="mt-2 flex items-center justify-between gap-3 rounded border bg-slate-50 p-2 text-sm"><span>{archivo.nombre}</span><button type="button" onClick={() => setEvidencias((actual) => actual.filter((item) => item.url !== archivo.url))} className="font-semibold text-red-700">Quitar</button></div>)}</div><button disabled={guardando} onClick={guardar} className="rounded-lg bg-[#0F3D1F] px-5 py-3 font-semibold text-white disabled:bg-slate-400">{guardando ? "Guardando..." : "Cerrar SAC y generar PDF"}</button></section></div>;
}
