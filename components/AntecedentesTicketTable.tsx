"use client";

import { useState }
from "react";

import toast
from "react-hot-toast";

import {
  autorizacionAntecedenteOpciones,
  eaiOpciones,
  motivoAntecedenteOpciones,
  observacionAntecedenteOpciones,
  puedeVerAntecedenteCompleto,
  revisadoPorOpciones,
  tipoDocumentoOpciones,
} from "@/lib/antecedentesCatalogos";

import {
  OBSERVACION_DOCUMENTO_NO_CORRESPONDE,
  OBSERVACION_NO_TENER_EN_CUENTA,
  validarRegistroAntecedente,
} from "@/lib/validacionAntecedentesGestion";

type Registro = {
  id: number;
  fechaSolicitud?: string | null;
  fechaRespuesta?: string | null;
  eai?: string | null;
  nombresApellidos?: string | null;
  tipoDocumento?: string | null;
  identificacion: string;
  fechaExpedicionDocumento?: string | null;
  observacion?: string | null;
  revisadoPor?: string | null;
  motivo?: string | null;
  autorizacion?: string | null;
  observaciones?: string | null;
};

function claseFilaPorObservacion(
  observacion?: string | null
) {
  if (
    observacion ===
    OBSERVACION_NO_TENER_EN_CUENTA
  ) {
    return "align-top bg-yellow-100 text-red-700";
  }

  if (
    observacion ===
    OBSERVACION_DOCUMENTO_NO_CORRESPONDE
  ) {
    return "align-top bg-green-100 text-black";
  }

  return "align-top";
}

function SelectCampo({
  value,
  options,
  onChange,
}: {
  value?: string | null;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value || ""}
      onChange={(event) =>
        onChange(event.target.value)
      }
      className="border rounded-md p-2 min-w-44"
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
  );
}

export default function AntecedentesTicketTable({
  registros,
  role,
  solicitudId,
}: {
  registros: Registro[];
  role?: string | null;
  solicitudId: number;
}) {
  const [filas, setFilas] =
    useState(registros);

  const [
    guardandoTodo,
    setGuardandoTodo,
  ] = useState(false);

  const puedeVerCompleto =
    puedeVerAntecedenteCompleto(role);

  function actualizarFila(
    id: number,
    campo: keyof Registro,
    valor: string
  ) {
    setFilas((actuales) =>
      actuales.map((fila) =>
        fila.id === id
          ? {
              ...fila,
              [campo]: valor,
            }
          : fila
      )
    );
  }

  async function guardarTodo() {
    try {
      const errorValidacion =
        filas
          .map(validarRegistroAntecedente)
          .find(Boolean);

      if (errorValidacion) {
        toast.error(errorValidacion);
        return;
      }

      setGuardandoTodo(true);

      const response =
        await fetch(
          `/api/antecedentes/guardar-ticket/${solicitudId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              registros: filas,
            }),
          }
        );

      if (!response.ok) {
        const data =
          await response.json();

        throw new Error(
          data.error ||
          "No se pudo guardar"
        );
      }

      const data =
        await response.json();

      setFilas(
        data.registros || filas
      );

      toast.success(
        "Gestion del ticket guardada correctamente"
      );

    } catch (error: any) {
      console.error(error);

      toast.error(
        error.message ||
        "Error al guardar antecedente"
      );

    } finally {
      setGuardandoTodo(false);
    }
  }

  if (!filas.length) {
    return (
      <div className="mt-4 rounded-lg border border-dashed p-4 text-sm text-gray-500">
        No hay personas cargadas desde el Excel.
      </div>
    );
  }

  return (
    <div className="mt-5 border-t pt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold text-lg">
          Personas del estudio de antecedentes
        </h3>

        <a
          href={`/api/antecedentes/exportar/${solicitudId}`}
          className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Descargar Excel
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">
                Fecha solicitud
              </th>
              <th className="border p-2 text-left">
                Fecha respuesta
              </th>
              <th className="border p-2 text-left">
                EAI
              </th>
              <th className="border p-2 text-left">
                Nombres y apellidos
              </th>
              <th className="border p-2 text-left">
                Tipo documento
              </th>
              <th className="border p-2 text-left">
                Identificacion
              </th>
              <th className="border p-2 text-left">
                Fecha expedicion
              </th>
              <th className="border p-2 text-left">
                Observacion
              </th>

              {puedeVerCompleto && (
                <>
                  <th className="border p-2 text-left">
                    Revisado por
                  </th>
                  <th className="border p-2 text-left">
                    Motivo
                  </th>
                  <th className="border p-2 text-left">
                    Autorizacion
                  </th>
                  <th className="border p-2 text-left">
                    Observaciones
                  </th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {filas.map((fila) => {
              const requiereMotivo =
                fila.observacion ===
                OBSERVACION_NO_TENER_EN_CUENTA;

              return (
              <tr
                key={fila.id}
                className={claseFilaPorObservacion(
                  fila.observacion
                )}
              >
                <td className="border p-2">
                  {fila.fechaSolicitud || ""}
                </td>
                <td className="border p-2">
                  {fila.fechaRespuesta || ""}
                </td>
                <td className="border p-2">
                  {puedeVerCompleto ? (
                    <SelectCampo
                      value={fila.eai}
                      options={eaiOpciones}
                      onChange={(value) =>
                        actualizarFila(
                          fila.id,
                          "eai",
                          value
                        )
                      }
                    />
                  ) : (
                    fila.eai || ""
                  )}
                </td>
                <td className="border p-2 min-w-56">
                  {fila.nombresApellidos || ""}
                </td>
                <td className="border p-2">
                  {puedeVerCompleto ? (
                    <SelectCampo
                      value={fila.tipoDocumento}
                      options={
                        tipoDocumentoOpciones
                      }
                      onChange={(value) =>
                        actualizarFila(
                          fila.id,
                          "tipoDocumento",
                          value
                        )
                      }
                    />
                  ) : (
                    fila.tipoDocumento || ""
                  )}
                </td>
                <td className="border p-2">
                  {fila.identificacion}
                </td>
                <td className="border p-2">
                  {
                    fila
                      .fechaExpedicionDocumento ||
                    ""
                  }
                </td>
                <td className="border p-2">
                  {puedeVerCompleto ? (
                    <div className="flex flex-col gap-1">
                    <SelectCampo
                      value={fila.observacion}
                      options={
                        observacionAntecedenteOpciones
                      }
                      onChange={(value) =>
                        actualizarFila(
                          fila.id,
                          "observacion",
                          value
                        )
                      }
                    />
                    <span className="text-xs font-semibold">
                      Obligatorio
                    </span>
                    </div>
                  ) : (
                    fila.observacion || ""
                  )}
                </td>

                {puedeVerCompleto && (
                  <>
                    <td className="border p-2">
                      <div className="flex flex-col gap-1">
                      <SelectCampo
                        value={fila.revisadoPor}
                        options={revisadoPorOpciones}
                        onChange={(value) =>
                          actualizarFila(
                            fila.id,
                            "revisadoPor",
                            value
                          )
                        }
                      />
                      <span className="text-xs font-semibold">
                        Obligatorio
                      </span>
                      </div>
                    </td>
                    <td className="border p-2">
                      <SelectCampo
                        value={fila.autorizacion}
                        options={
                          autorizacionAntecedenteOpciones
                        }
                        onChange={(value) =>
                          actualizarFila(
                            fila.id,
                            "autorizacion",
                            value
                          )
                        }
                      />
                    </td>
                    <td className="border p-2">
                      <div className="flex flex-col gap-1">
                      <SelectCampo
                        value={fila.motivo}
                        options={
                          motivoAntecedenteOpciones
                        }
                        onChange={(value) =>
                          actualizarFila(
                            fila.id,
                            "motivo",
                            value
                          )
                        }
                      />
                      {requiereMotivo && (
                        <span className="text-xs font-semibold">
                          Obligatorio
                        </span>
                      )}
                      </div>
                    </td>
                    <td className="border p-2">
                      <div className="flex flex-col gap-1">
                      <textarea
                        value={
                          fila.observaciones || ""
                        }
                        onChange={(event) =>
                          actualizarFila(
                            fila.id,
                            "observaciones",
                            event.target.value
                          )
                        }
                        className="min-w-60 rounded-md border p-2"
                        placeholder="Observaciones internas"
                      />
                      {requiereMotivo && (
                        <span className="text-xs font-semibold">
                          Obligatorio
                        </span>
                      )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {puedeVerCompleto && (
        <div className="mt-4 flex justify-start">
          <button
            type="button"
            onClick={guardarTodo}
            disabled={guardandoTodo}
            className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {guardandoTodo
              ? "Guardando gestion..."
              : "Guardar gestion del ticket"}
          </button>
        </div>
      )}
    </div>
  );
}
