"use client";

import { useState }
from "react";

import { useRouter }
from "next/navigation";

import toast
from "react-hot-toast";

import {
  autorizacionAntecedenteOpciones,
  eaiOpciones,
  motivoAntecedenteOpciones,
  observacionAntecedenteOpciones,
  revisadoPorOpciones,
  tipoDocumentoOpciones,
} from "@/lib/antecedentesCatalogos";

import {
  OBSERVACION_NO_TENER_EN_CUENTA,
} from "@/lib/validacionAntecedentesGestion";

import { obtenerFechaActualColombiaISO }
from "@/lib/fecha";

const fechaActual =
  obtenerFechaActualColombiaISO();

const estadoInicial = {
  fechaSolicitud: fechaActual,
  fechaRespuesta: fechaActual,
  eai: "",
  nombresApellidos: "",
  tipoDocumento: "",
  identificacion: "",
  fechaExpedicionDocumento: "",
  observacion: "",
  revisadoPor: "",
  motivo: "",
  autorizacion: "",
  observaciones: "",
};

function SelectCampo({
  label,
  name,
  value,
  options,
  required,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
  required?: boolean;
  onChange: (
    name: string,
    value: string
  ) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
      {label}
      <select
        name={name}
        value={value}
        required={required}
        onChange={(event) =>
          onChange(
            name,
            event.target.value
          )
        }
        className="rounded-lg border border-slate-300 bg-white p-2.5 font-normal"
      >
        <option value="">
          Seleccione
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function FormularioAntecedenteManual() {
  const router =
    useRouter();

  const [abierto, setAbierto] =
    useState(false);

  const [guardando, setGuardando] =
    useState(false);

  const [form, setForm] =
    useState(estadoInicial);

  const requiereDetalle =
    form.observacion ===
    OBSERVACION_NO_TENER_EN_CUENTA;

  function actualizar(
    name: string,
    value: string
  ) {
    setForm((actual) => ({
      ...actual,
      [name]:
        name === "identificacion"
          ? value.replace(/\D/g, "")
          : value,
    }));
  }

  async function guardar(
    event: React.FormEvent
  ) {
    event.preventDefault();

    try {
      setGuardando(true);

      const response =
        await fetch(
          "/api/antecedentes/manual",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(form),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "No se pudo guardar"
        );
      }

      toast.success(
        "Antecedente manual guardado"
      );

      const identificacion =
        form.identificacion;

      setForm(estadoInicial);
      setAbierto(false);
      router.push(
        `/antecedentes?identificacion=${identificacion}`
      );
      router.refresh();

    } catch (error: any) {
      console.error(error);

      toast.error(
        error.message ||
        "Error guardando antecedente"
      );

    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">
            Registro manual historico
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Agregue una novedad manual cuando una finca solicite rechazar o registrar un antecedente especifico.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setAbierto(
              (actual) => !actual
            )
          }
          className="rounded-lg bg-[#0F3D1F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#14532d]"
        >
          {abierto
            ? "Cerrar formulario"
            : "Agregar registro"}
        </button>
      </div>

      {abierto && (
        <form
          onSubmit={guardar}
          className="mt-5 grid gap-4"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              Fecha de solicitud
              <input
                type="date"
                name="fechaSolicitud"
                value={form.fechaSolicitud}
                required
                onChange={(event) =>
                  actualizar(
                    event.target.name,
                    event.target.value
                  )
                }
                className="rounded-lg border border-slate-300 p-2.5 font-normal"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              Fecha respuesta
              <input
                type="date"
                name="fechaRespuesta"
                value={form.fechaRespuesta}
                required
                onChange={(event) =>
                  actualizar(
                    event.target.name,
                    event.target.value
                  )
                }
                className="rounded-lg border border-slate-300 p-2.5 font-normal"
              />
            </label>

            <SelectCampo
              label="EAI"
              name="eai"
              value={form.eai}
              options={eaiOpciones}
              required
              onChange={actualizar}
            />

            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700 md:col-span-2">
              Nombres y apellidos
              <input
                name="nombresApellidos"
                value={form.nombresApellidos}
                required
                onChange={(event) =>
                  actualizar(
                    event.target.name,
                    event.target.value
                  )
                }
                className="rounded-lg border border-slate-300 p-2.5 font-normal uppercase"
              />
            </label>

            <SelectCampo
              label="Tipo documento"
              name="tipoDocumento"
              value={form.tipoDocumento}
              options={tipoDocumentoOpciones}
              required
              onChange={actualizar}
            />

            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              Identificacion
              <input
                name="identificacion"
                value={form.identificacion}
                required
                inputMode="numeric"
                pattern="\d+"
                onChange={(event) =>
                  actualizar(
                    event.target.name,
                    event.target.value
                  )
                }
                className="rounded-lg border border-slate-300 p-2.5 font-normal"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              Fecha expedicion documento
              <input
                type="date"
                name="fechaExpedicionDocumento"
                value={
                  form.fechaExpedicionDocumento
                }
                onChange={(event) =>
                  actualizar(
                    event.target.name,
                    event.target.value
                  )
                }
                className="rounded-lg border border-slate-300 p-2.5 font-normal"
              />
            </label>

            <SelectCampo
              label="Observacion"
              name="observacion"
              value={form.observacion}
              options={observacionAntecedenteOpciones}
              required
              onChange={actualizar}
            />

            <SelectCampo
              label="Revisado por"
              name="revisadoPor"
              value={form.revisadoPor}
              options={revisadoPorOpciones}
              required
              onChange={actualizar}
            />

            <SelectCampo
              label="Motivo"
              name="motivo"
              value={form.motivo}
              options={motivoAntecedenteOpciones}
              required={requiereDetalle}
              onChange={actualizar}
            />

            <SelectCampo
              label="Autorizacion"
              name="autorizacion"
              value={form.autorizacion}
              options={autorizacionAntecedenteOpciones}
              onChange={actualizar}
            />

            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700 xl:col-span-3">
              Observaciones
              <textarea
                name="observaciones"
                value={form.observaciones}
                required={requiereDetalle}
                onChange={(event) =>
                  actualizar(
                    event.target.name,
                    event.target.value
                  )
                }
                className="min-h-24 rounded-lg border border-slate-300 p-2.5 font-normal"
                placeholder="Detalle del motivo informado por la finca o soporte de la decision"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-400"
            >
              {guardando
                ? "Guardando..."
                : "Guardar registro"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
