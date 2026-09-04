"use client";

import { useState }
from "react";

import { useSession }
from "next-auth/react";

import { useRouter }
from "next/navigation";

import toast
from "react-hot-toast";

import UploadButton
from "@/components/uploadthing/UploadButton";

import { eaiOpciones }
from "@/lib/antecedentesCatalogos";

import {
  actosInsegurosVulnerabilidad,
  estadosVulnerabilidad,
} from "@/lib/vulnerabilidades";

type Archivo = {
  url: string;
  nombre: string;
  tipo?: string;
};

export default function FormularioVulnerabilidad() {
  const { data: session } =
    useSession();

  const reportadoPorAutomatico =
    session?.user?.name ||
    session?.user?.email ||
    "";
  const router =
    useRouter();

  const [form, setForm] =
    useState({
      eai: "",
      actoInseguro: "",
      vulnerabilidad: "",
      planAccionSugerido: "",
      estado: "ABIERTO",
      reportadoPor: "",
    });

  const [enviando, setEnviando] =
    useState(false);
  const [fotos, setFotos] =
    useState<Archivo[]>([]);

  function actualizar(
    campo: keyof typeof form,
    valor: string
  ) {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  async function enviarInforme(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (enviando) {
      return;
    }

    try {
      if (fotos.length === 0) {
        toast.error(
          "Debe adjuntar al menos una imagen de la novedad"
        );

        return;
      }

      setEnviando(true);

      const response =
        await fetch(
          "/api/vulnerabilidades",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              ...form,
              fotos,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "No se pudo enviar el informe"
        );
      }

      toast.success(
        `Informe #${data.informeId} enviado correctamente`
      );

      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (error: any) {
      console.error(error);

      toast.error(
        error.message ||
        "Error enviando informe"
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviarInforme}
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-md"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-600">
            Finca / EAI
          </label>
          <select
            value={form.eai}
            onChange={(event) =>
              actualizar(
                "eai",
                event.target.value
              )
            }
            className="rounded-lg border p-3"
            required
          >
            <option value="">
              Seleccione
            </option>
            {eaiOpciones.map((eai) => (
              <option
                key={eai}
                value={eai}
              >
                {eai}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-600">
            Fecha y hora de ejecucion
          </label>
          <p className="rounded-lg border bg-slate-100 p-3 text-sm text-slate-600">
            Se registran automaticamente al guardar el analisis.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-600">
            Estado
          </label>
          <select
            value={form.estado}
            onChange={(event) =>
              actualizar(
                "estado",
                event.target.value
              )
            }
            className="rounded-lg border p-3"
            required
          >
            {estadosVulnerabilidad.map(
              (estado) => (
                <option
                  key={estado}
                  value={estado}
                >
                  {estado}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-600">
          Persona que realizo el reporte
        </label>
        <input
          value={reportadoPorAutomatico}
          readOnly
          className="rounded-lg border bg-slate-100 p-3"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-600">
          Acto inseguro
        </label>
        <select
          value={form.actoInseguro}
          onChange={(event) =>
            actualizar(
              "actoInseguro",
              event.target.value
            )
          }
          className="rounded-lg border p-3"
          required
        >
          <option value="">
            Seleccione
          </option>
          {actosInsegurosVulnerabilidad.map(
            (acto) => (
              <option
                key={acto}
                value={acto}
              >
                {acto}
              </option>
            )
          )}
        </select>
      </div>

      <textarea
        value={form.vulnerabilidad}
        onChange={(event) =>
          actualizar(
            "vulnerabilidad",
            event.target.value
          )
        }
        className="min-h-28 rounded-lg border p-3"
        placeholder="Vulnerabilidad detectada"
        required
      />

      <textarea
        value={form.planAccionSugerido}
        onChange={(event) =>
          actualizar(
            "planAccionSugerido",
            event.target.value
          )
        }
        className="min-h-28 rounded-lg border p-3"
        placeholder="Acciones tomadas"
        required
      />

      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-gray-700">
          Imagen de la novedad
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Obligatoria para generar el informe PDF.
        </p>
        <UploadButton
          allowedExtensions={[
            "jpg",
            "jpeg",
          ]}
          allowedExtensionsLabel="imagenes JPG o JPEG"
          onCompleteMany={(
            archivos: Archivo[]
          ) =>
            setFotos(
              (actuales) => [
                ...actuales,
                ...archivos,
              ]
            )
          }
        />

        {fotos.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            {fotos.map((foto) => (
              <div
                key={foto.url}
                className="flex items-center justify-between gap-2 rounded-lg border bg-white p-2 text-sm font-semibold text-[#0F3D1F]"
              >
                <a href={foto.url} target="_blank" rel="noreferrer" className="hover:underline">{foto.nombre}</a>
                <button type="button" onClick={() => setFotos((actuales) => actuales.filter((item) => item.url !== foto.url))} className="shrink-0 text-red-700 hover:underline">Quitar adjunto</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="self-center rounded-md bg-[#0F3D1F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#14532d] disabled:bg-gray-500"
      >
        {enviando
          ? "Generando y enviando..."
          : "Generar informe y enviar correo"}
      </button>
    </form>
  );
}
