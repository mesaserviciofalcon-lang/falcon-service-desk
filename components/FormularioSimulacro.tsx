"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import UploadButton from "@/components/uploadthing/UploadButton";

type Archivo = { nombre: string; url: string; tipo?: string };

export default function FormularioSimulacro({ actividad, definicion }: { actividad: { id: number; finca: string; area: string | null; actividad: string; supervisorNombre: string | null }; definicion: { analista: string; objetivo: string; riesgo: string; controles: string[]; guionInicial: string; aspectos: string[] } }) {
  const [horaInicio, setHoraInicio] = useState("");
  const [resultado, setResultado] = useState("");
  const [cumplimientoObjetivo, setCumplimientoObjetivo] = useState("");
  const [desarrollo, setDesarrollo] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [controlVulnerado, setControlVulnerado] = useState("");
  const [razonIncumplimiento, setRazonIncumplimiento] = useState("");
  const [factoresFalla, setFactoresFalla] = useState<string[]>([]);
  const [evidencias, setEvidencias] = useState<Archivo[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [aspectos, setAspectos] = useState(definicion.aspectos.map((nombre) => ({ nombre, calificacion: "" })));
  const requiereSac = resultado === "NO DETECTADO";
  const desarrolloPlantilla = useMemo(() => horaInicio ? `${horaInicio} - Por parte del coordinador del simulacro se explica la ejecución de la actividad y su alcance, según el guion establecido.\n\n${horaInicio} - ${definicion.guionInicial}\n\n[Continúe aquí el desarrollo cronológico del simulacro.]` : "", [horaInicio, definicion.guionInicial]);

  async function guardar() {
    setGuardando(true);
    try {
      const respuesta = await fetch(`/api/actividades-supervisores/${actividad.id}/simulacro`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ horaInicio, resultado, cumplimientoObjetivo, desarrollo: desarrollo || desarrolloPlantilla, aspectos, conclusion, controlVulnerado, razonIncumplimiento, factoresFalla, evidencias }) });
      const data = await respuesta.json();
      if (!respuesta.ok) throw new Error(data.error || "No fue posible guardar el simulacro");
      toast.success(data.requiereSac ? "Simulacro cerrado. Se generó una SAC para el Analista SIG." : "Simulacro cerrado y notificado correctamente.");
      window.location.href = `/actividades-supervisores/${actividad.id}/simulacro`;
    } catch (error: any) {
      toast.error(error.message || "No fue posible guardar el simulacro");
    } finally { setGuardando(false); }
  }

  return <div className="mx-auto max-w-4xl space-y-5">
    <div className="flex items-start justify-between gap-4"><div><h1 className="text-3xl font-bold text-[#0F3D1F]">Formulario de simulacro</h1><p className="mt-1 text-slate-600">{actividad.actividad} · {actividad.finca} · {actividad.area || "Sin área"}</p></div><Link href={`/actividades-supervisores/${actividad.id}`} className="rounded-lg border bg-white px-4 py-2 font-semibold">Volver</Link></div>
    <section className="rounded-xl border bg-white p-5 shadow-sm"><div className="grid gap-3 text-sm md:grid-cols-2"><p><strong>Coordinador:</strong> {actividad.supervisorNombre}</p><p><strong>Analista SIG coordinado:</strong> {definicion.analista}</p><p><strong>Riesgo:</strong> {definicion.riesgo}</p><p><strong>Controles:</strong> {definicion.controles.join(", ")}</p></div><p className="mt-4 text-sm"><strong>Objetivo:</strong> {definicion.objetivo}</p><p className="mt-3 whitespace-pre-wrap rounded bg-slate-50 p-3 text-sm"><strong>Guion base:</strong> {definicion.guionInicial}</p></section>
    <section className="rounded-xl border bg-white p-5 shadow-sm space-y-4"><h2 className="text-xl font-bold text-[#0F3D1F]">Resultados y evaluación</h2><div className="grid gap-4 md:grid-cols-2"><label className="font-semibold">Hora de inicio<input type="time" value={horaInicio} onChange={(e) => { setHoraInicio(e.target.value); if (!desarrollo) setDesarrollo(""); }} className="mt-1 w-full rounded border p-3 font-normal" /></label><label className="font-semibold">Resultado<select value={resultado} onChange={(e) => setResultado(e.target.value)} className="mt-1 w-full rounded border p-3 font-normal"><option value="">Seleccione</option><option value="DETECTADO">Detectado</option><option value="NO DETECTADO">No detectado / perdido</option></select></label></div><label className="block font-semibold">Cumplimiento del objetivo<textarea value={cumplimientoObjetivo} onChange={(e) => setCumplimientoObjetivo(e.target.value)} className="mt-1 min-h-24 w-full rounded border p-3 font-normal" /></label><label className="block font-semibold">Desarrollo del simulacro<textarea value={desarrollo} placeholder={desarrolloPlantilla || "Indique primero la hora de inicio"} onChange={(e) => setDesarrollo(e.target.value)} className="mt-1 min-h-56 w-full rounded border p-3 font-normal" /></label><div><p className="font-semibold">Aspectos a evaluar <span className="font-normal">(3 excelente, 2 bueno, 1 deficiente)</span></p><div className="mt-2 space-y-2">{aspectos.map((aspecto, indice) => <label key={aspecto.nombre} className="flex items-center justify-between gap-3 rounded border p-3 text-sm"><span>{aspecto.nombre}</span><select value={aspecto.calificacion} onChange={(e) => setAspectos((actual) => actual.map((item, i) => i === indice ? { ...item, calificacion: e.target.value } : item))} className="rounded border p-2"><option value="">Califique</option><option value="3">3 - Excelente</option><option value="2">2 - Bueno</option><option value="1">1 - Deficiente</option></select></label>)}</div></div><label className="block font-semibold">Conclusión general<textarea value={conclusion} onChange={(e) => setConclusion(e.target.value)} className="mt-1 min-h-28 w-full rounded border p-3 font-normal" /></label><label className="block font-semibold">Control vulnerado (si aplica)<input value={controlVulnerado} onChange={(e) => setControlVulnerado(e.target.value)} className="mt-1 w-full rounded border p-3 font-normal" /></label>{requiereSac && <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="font-semibold text-red-900">Este resultado requiere una Solicitud de Acción Correctiva (SAC).</p><label className="mt-3 block font-semibold">Razón del incumplimiento<textarea value={razonIncumplimiento} onChange={(e) => setRazonIncumplimiento(e.target.value)} className="mt-1 min-h-24 w-full rounded border p-3 font-normal" /></label><p className="mt-3 font-semibold">Factores identificados</p>{["Capacitación y competencia", "Roles y responsabilidades", "Estandarización", "Recursos", "Aseguramiento", "Factor externo"].map((factor) => <label key={factor} className="mt-1 flex gap-2 text-sm"><input type="checkbox" checked={factoresFalla.includes(factor)} onChange={(e) => setFactoresFalla((actual) => e.target.checked ? [...actual, factor] : actual.filter((item) => item !== factor))} />{factor}</label>)}</div>}<div><p className="font-semibold">Evidencias fotográficas o PDF</p><div className="mt-2"><UploadButton allowedExtensions={["jpg", "jpeg", "png", "webp", "pdf"]} allowedExtensionsLabel="imágenes o PDF" onCompleteMany={(archivos: Archivo[]) => setEvidencias((actual) => [...actual, ...archivos])} /></div>{evidencias.map((archivo) => <p key={archivo.url} className="mt-2 rounded bg-slate-50 p-2 text-sm">{archivo.nombre}</p>)}</div><button disabled={guardando} onClick={guardar} className="rounded-lg bg-[#0F3D1F] px-5 py-3 font-semibold text-white disabled:bg-slate-400">{guardando ? "Guardando..." : "Cerrar simulacro y generar informe"}</button></section>
  </div>;
}
