"use client";

import { useState } from "react";

import toast from "react-hot-toast";

import {
  autorizacionAntecedenteOpciones,
  motivoAntecedenteOpciones,
  observacionAntecedenteOpciones,
  revisadoPorOpciones,
} from "@/lib/antecedentesCatalogos";

import {
  OBSERVACION_DOCUMENTO_NO_CORRESPONDE,
  OBSERVACION_NO_TENER_EN_CUENTA,
  validarRegistroAntecedente,
} from "@/lib/validacionAntecedentesGestion";

type RegistroConsulta = {
  id: number;
  solicitudId: number;
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
  solicitud: {
    antecedente?: {
      fincaEAI?: string | null;
    } | null;
  };
};

function claseFilaPorObservacion(
  observacion?: string | null
) {
  if (
    observacion ===
    OBSERVACION_NO_TENER_EN_CUENTA
  ) {
    return "bg-yellow-300 text-red-800";
  }

  if (
    observacion ===
    OBSERVACION_DOCUMENTO_NO_CORRESPONDE
  ) {
    return "bg-green-300 text-black";
  }

  return "";
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
      className="w-full rounded-md border bg-white p-2 text-sm text-gray-900"
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

export default function ConsultaAntecedentesResultados({
  registros,
  puedeEditar,
  puedeVerCompleto,
}: {
  registros: RegistroConsulta[];
  puedeEditar: boolean;
  puedeVerCompleto: boolean;
}) {
  const [filas, setFilas] =
    useState(registros);
  const [procesandoId, setProcesandoId] =
    useState<number | null>(null);

  function actualizarFila(
    id: number,
    campo: keyof RegistroConsulta,
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

  async function guardarRegistro(
    registro: RegistroConsulta
  ) {
    const errorValidacion =
      validarRegistroAntecedente(
        registro
      );

    if (errorValidacion) {
      toast.error(errorValidacion);
      return;
    }

    try {
      setProcesandoId(registro.id);

      const response =
        await fetch(
          `/api/antecedentes/${registro.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              observacion:
                registro.observacion,
              revisadoPor:
                registro.revisadoPor,
              motivo:
                registro.motivo,
              autorizacion:
                registro.autorizacion,
              observaciones:
                registro.observaciones,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "No se pudo actualizar"
        );
      }

      setFilas((actuales) =>
        actuales.map((fila) =>
          fila.id === registro.id
            ? {
                ...fila,
                ...data,
              }
            : fila
        )
      );

      toast.success(
        "Registro actualizado"
      );
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.message ||
          "Error actualizando registro"
      );
    } finally {
      setProcesandoId(null);
    }
  }

  async function eliminarRegistro(
    registro: RegistroConsulta
  ) {
    const confirmar =
      window.confirm(
        `Seguro que desea eliminar el registro de ${registro.identificacion}?`
      );

    if (!confirmar) {
      return;
    }

    try {
      setProcesandoId(registro.id);

      const response =
        await fetch(
          `/api/antecedentes/${registro.id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "No se pudo eliminar"
        );
      }

      setFilas((actuales) =>
        actuales.filter(
          (fila) =>
            fila.id !== registro.id
        )
      );

      toast.success(
        "Registro eliminado"
      );
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.message ||
          "Error eliminando registro"
      );
    } finally {
      setProcesandoId(null);
    }
  }

  if (filas.length === 0) {
    return (
      <p className="text-gray-500">
        No se encontraron registros.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">
              Fecha solicitud
            </th>
            {puedeVerCompleto && (
              <th className="border p-2 text-left">
                Fecha respuesta
              </th>
            )}
            {puedeVerCompleto && (
              <th className="border p-2 text-left">
                EAI
              </th>
            )}
            <th className="border p-2 text-left">
              Identificacion
            </th>
            <th className="border p-2 text-left">
              Nombres y apellidos
            </th>
            {puedeVerCompleto && (
              <th className="border p-2 text-left">
                Tipo documento
              </th>
            )}
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
                  Ticket
                </th>
              </>
            )}
            {puedeEditar && (
              <th className="border p-2 text-left">
                Acciones
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {filas.map((registro) => (
            <tr
              key={registro.id}
              className={claseFilaPorObservacion(
                registro.observacion
              )}
            >
              <td className="border p-2">
                {registro.fechaSolicitud || ""}
              </td>
              {puedeVerCompleto && (
                <td className="border p-2">
                  {registro.fechaRespuesta || ""}
                </td>
              )}
              {puedeVerCompleto && (
                <td className="border p-2">
                  {registro.eai || ""}
                </td>
              )}
              <td className="border p-2">
                {registro.identificacion}
              </td>
              <td className="border p-2">
                {registro.nombresApellidos || ""}
              </td>
              {puedeVerCompleto && (
                <td className="border p-2">
                  {registro.tipoDocumento || ""}
                </td>
              )}
              <td className="border p-2">
                {registro
                  .fechaExpedicionDocumento ||
                  ""}
              </td>
              <td className="min-w-72 border p-2">
                {puedeEditar ? (
                  <SelectCampo
                    value={registro.observacion}
                    options={
                      observacionAntecedenteOpciones
                    }
                    onChange={(value) =>
                      actualizarFila(
                        registro.id,
                        "observacion",
                        value
                      )
                    }
                  />
                ) : (
                  registro.observacion || ""
                )}
              </td>

              {puedeVerCompleto && (
                <>
                  <td className="min-w-56 border p-2">
                    {puedeEditar ? (
                      <SelectCampo
                        value={registro.revisadoPor}
                        options={revisadoPorOpciones}
                        onChange={(value) =>
                          actualizarFila(
                            registro.id,
                            "revisadoPor",
                            value
                          )
                        }
                      />
                    ) : (
                      registro.revisadoPor ||
                      ""
                    )}
                  </td>
                  <td className="min-w-44 border p-2">
                    {puedeEditar ? (
                      <SelectCampo
                        value={registro.motivo}
                        options={
                          motivoAntecedenteOpciones
                        }
                        onChange={(value) =>
                          actualizarFila(
                            registro.id,
                            "motivo",
                            value
                          )
                        }
                      />
                    ) : (
                      registro.motivo || ""
                    )}
                  </td>
                  <td className="min-w-40 border p-2">
                    {puedeEditar ? (
                      <SelectCampo
                        value={registro.autorizacion}
                        options={
                          autorizacionAntecedenteOpciones
                        }
                        onChange={(value) =>
                          actualizarFila(
                            registro.id,
                            "autorizacion",
                            value
                          )
                        }
                      />
                    ) : (
                      registro.autorizacion ||
                      ""
                    )}
                  </td>
                  <td className="min-w-72 border p-2">
                    {puedeEditar ? (
                      <textarea
                        value={
                          registro.observaciones ||
                          ""
                        }
                        onChange={(event) =>
                          actualizarFila(
                            registro.id,
                            "observaciones",
                            event.target.value
                          )
                        }
                        className="h-20 w-full resize-none rounded-md border bg-white p-2 text-sm text-gray-900"
                        placeholder="Observaciones"
                      />
                    ) : (
                      registro.observaciones ||
                      ""
                    )}
                  </td>
                  <td className="border p-2">
                    {registro.solicitud
                      .antecedente
                      ?.fincaEAI ===
                    "HISTORICO" ? (
                      "Historico"
                    ) : (
                      <a
                        href={`/tickets/${registro.solicitudId}`}
                        className="text-blue-600 underline"
                      >
                        #{registro.solicitudId}
                      </a>
                    )}
                  </td>
                </>
              )}

              {puedeEditar && (
                <td className="min-w-44 border p-2">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        guardarRegistro(
                          registro
                        )
                      }
                      disabled={
                        procesandoId ===
                        registro.id
                      }
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        eliminarRegistro(
                          registro
                        )
                      }
                      disabled={
                        procesandoId ===
                        registro.id
                      }
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-gray-400"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
