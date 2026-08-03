"use client";

import { useState }
from "react";

import { useRouter }
from "next/navigation";

import toast
from "react-hot-toast";

import { eaiOpciones }
from "@/lib/antecedentesCatalogos";

import { revisadoPorOpciones }
from "@/lib/antecedentesCatalogos";

import {
  actosInsegurosVulnerabilidad,
  estadosVulnerabilidad,
} from "@/lib/vulnerabilidades";

export default function FormularioVulnerabilidad() {
  const router =
    useRouter();

  const [form, setForm] =
    useState({
      eai: "",
      fecha:
        new Date()
          .toISOString()
          .slice(0, 10),
      actoInseguro: "",
      vulnerabilidad: "",
      planAccionSugerido: "",
      estado: "ABIERTO",
      reportadoPor: "",
    });

  const [enviando, setEnviando] =
    useState(false);

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
            Fecha
          </label>
          <input
            type="date"
            value={form.fecha}
            onChange={(event) =>
              actualizar(
                "fecha",
                event.target.value
              )
            }
            className="rounded-lg border p-3"
            required
          />
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
        <select
          value={form.reportadoPor}
          onChange={(event) =>
            actualizar(
              "reportadoPor",
              event.target.value
            )
          }
          className="rounded-lg border p-3"
          required
        >
          <option value="">
            Seleccione
          </option>
          {revisadoPorOpciones.map(
            (supervisor) => (
              <option
                key={supervisor}
                value={supervisor}
              >
                {supervisor}
              </option>
            )
          )}
        </select>
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
        placeholder="Plan de accion sugerido por Seguridad"
        required
      />

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
