"use client";

import { useState }
from "react";

import { useSession }
from "next-auth/react";

import { useRouter }
from "next/navigation";

import toast
from "react-hot-toast";

import {
  autorizacionAntecedenteOpciones,
  eaiOpciones,
  motivoAntecedenteManualOpciones,
  observacionAntecedenteOpciones,
  tipoDocumentoOpciones,
} from "@/lib/antecedentesCatalogos";

import {
  esObservacionCriticaAntecedente,
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

function normalizarFechaInput(
  valor?: string | null
) {
  const texto =
    String(valor || "").trim();

  if (!texto) {
    return "";
  }

  const iso =
    texto.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})/
    );

  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  }

  const local =
    texto.match(
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
    );

  if (local) {
    return `${local[3]}-${local[2].padStart(2, "0")}-${local[1].padStart(2, "0")}`;
  }

  return "";
}

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
  const { data: session } =
    useSession();

  const revisadoPorAutomatico =
    session?.user?.name ||
    session?.user?.email ||
    "";
  const router =
    useRouter();

  const [abierto, setAbierto] =
    useState(false);

  const [guardando, setGuardando] =
    useState(false);

  const [
    buscandoIdentificacion,
    setBuscandoIdentificacion,
  ] = useState(false);

  const [
    identificacionConsultada,
    setIdentificacionConsultada,
  ] = useState("");

  const [form, setForm] =
    useState(estadoInicial);

  const requiereDetalle =
    esObservacionCriticaAntecedente(
      form.observacion
    );

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

  async function buscarDatosIdentificacion() {
    const identificacion =
      form.identificacion.trim();

    if (
      identificacion.length < 5 ||
      identificacion ===
        identificacionConsultada
    ) {
      return;
    }

    try {
      setBuscandoIdentificacion(true);
      setIdentificacionConsultada(
        identificacion
      );

      const response =
        await fetch(
          `/api/antecedentes/manual?identificacion=${encodeURIComponent(
            identificacion
          )}`
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "No se pudo consultar la identificacion"
        );
      }

      const fechaExpedicion =
        normalizarFechaInput(
          data.registro
            ?.fechaExpedicionDocumento
        );

      if (fechaExpedicion) {
        setForm((actual) => ({
          ...actual,
          fechaExpedicionDocumento:
            actual
              .fechaExpedicionDocumento ||
            fechaExpedicion,
        }));

        toast.success(
          "Fecha de expedicion encontrada en el historico"
        );
      }

    } catch (error: any) {
      console.error(error);

      toast.error(
        error.message ||
        "Error consultando identificacion"
      );

    } finally {
      setBuscandoIdentificacion(false);
    }
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
              Identificacion
              <input
                name="identificacion"
                value={form.identificacion}
                required
                inputMode="numeric"
                pattern="\d+"
                onBlur={
                  buscarDatosIdentificacion
                }
                onChange={(event) =>
                  actualizar(
                    event.target.name,
                    event.target.value
                  )
                }
                className="rounded-lg border border-slate-300 p-2.5 font-normal"
              />
              {buscandoIdentificacion && (
                <span className="text-xs font-normal text-blue-700">
                  Buscando fecha de expedicion...
                </span>
              )}
            </label>

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

            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              Revisado por
              <input
                value={revisadoPorAutomatico}
                readOnly
                className="rounded-lg border border-slate-300 bg-slate-100 p-2.5 font-normal"
              />
            </label>

            <SelectCampo
              label="Motivo"
              name="motivo"
              value={form.motivo}
              options={motivoAntecedenteManualOpciones}
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
