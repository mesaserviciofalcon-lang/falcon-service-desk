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

  const [guardandoId, setGuardandoId] =
    useState<number | null>(null);

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

  async function guardarFila(
    fila: Registro
  ) {
    try {
      setGuardandoId(fila.id);

      const response =
        await fetch(
          `/api/antecedentes/${fila.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              eai: fila.eai,
              tipoDocumento:
                fila.tipoDocumento,
              observacion:
                fila.observacion,
              revisadoPor:
                fila.revisadoPor,
              motivo: fila.motivo,
              autorizacion:
                fila.autorizacion,
              observaciones:
                fila.observaciones,
            }),
          }
        );

      if (!response.ok) {
        throw new Error(
          "No se pudo guardar"
        );
      }

      const registroActualizado =
        await response.json();

      setFilas((actuales) =>
        actuales.map((actual) =>
          actual.id === fila.id
            ? registroActualizado
            : actual
        )
      );

      toast.success(
        "Registro actualizado"
      );

    } catch (error) {
      console.error(error);

      toast.error(
        "Error al guardar antecedente"
      );

    } finally {
      setGuardandoId(null);
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
                  <th className="border p-2 text-left">
                    Accion
                  </th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {filas.map((fila) => (
              <tr
                key={fila.id}
                className="align-top"
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
                  ) : (
                    fila.observacion || ""
                  )}
                </td>

                {puedeVerCompleto && (
                  <>
                    <td className="border p-2">
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
                    </td>
                    <td className="border p-2">
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
                    </td>
                    <td className="border p-2">
                      <button
                        type="button"
                        disabled={
                          guardandoId === fila.id
                        }
                        onClick={() =>
                          guardarFila(fila)
                        }
                        className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {guardandoId === fila.id
                          ? "Guardando..."
                          : "Guardar"}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
