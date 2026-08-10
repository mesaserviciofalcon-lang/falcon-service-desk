"use client";

import { useState }
from "react";

import toast
from "react-hot-toast";

import {
  autorizacionAntecedenteOpciones,
  motivoAntecedenteOpciones,
  observacionAntecedenteOpciones,
  puedeEditarAntecedenteSinRestriccion,
  puedeVerAntecedenteCompleto,
  revisadoPorOpciones,
} from "@/lib/antecedentesCatalogos";

import {
  esObservacionCriticaAntecedente,
  esObservacionDocumentoNoCorresponde,
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
    esObservacionCriticaAntecedente(
      observacion
    )
  ) {
    return "align-top bg-yellow-300 text-red-800";
  }

  if (
    esObservacionDocumentoNoCorresponde(
      observacion
    )
  ) {
    return "align-top bg-green-300 text-black";
  }

  return "align-top";
}

function formatearFechaTabla(
  valor?: string | null
) {
  if (!valor) {
    return "";
  }

  const texto =
    valor.trim();

  const partes =
    texto.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

  if (partes) {
    return `${partes[3].padStart(2, "0")}/${partes[2].padStart(2, "0")}/${partes[1]}`;
  }

  const partesLocal =
    texto.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

  if (partesLocal) {
    return `${partesLocal[1].padStart(2, "0")}/${partesLocal[2].padStart(2, "0")}/${partesLocal[3]}`;
  }

  const fecha =
    new Date(texto);

  if (
    !Number.isNaN(
      fecha.getTime()
    )
  ) {
    return fecha.toLocaleDateString(
      "es-CO",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone:
          "America/Bogota",
      }
    );
  }

  return texto;
}

function fechaParaInput(
  valor?: string | null
) {
  if (!valor) {
    return "";
  }

  const texto =
    valor.trim();

  const partes =
    texto.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

  if (partes) {
    return `${partes[1]}-${partes[2].padStart(2, "0")}-${partes[3].padStart(2, "0")}`;
  }

  const partesLocal =
    texto.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

  if (partesLocal) {
    return `${partesLocal[3]}-${partesLocal[2].padStart(2, "0")}-${partesLocal[1].padStart(2, "0")}`;
  }

  return "";
}

function soloNumeros(valor: string) {
  return valor.replace(/\D/g, "");
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
      className="w-full rounded-md border p-2 text-sm"
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
  ticketEstado,
}: {
  registros: Registro[];
  role?: string | null;
  solicitudId: number;
  ticketEstado?: string | null;
}) {
  const [filas, setFilas] =
    useState(registros);

  const [filasOriginales] =
    useState(registros);

  const [
    guardandoTodo,
    setGuardandoTodo,
  ] = useState(false);

  const [
    tablaExpandida,
    setTablaExpandida,
  ] = useState(false);

  const puedeVerCompleto =
    puedeVerAntecedenteCompleto(role);

  const puedeEditarSinRestriccion =
    puedeEditarAntecedenteSinRestriccion(
      role
    );

  const esTicketReabierto =
    String(ticketEstado || "")
      .trim()
      .toUpperCase() === "REABIERTO";

  const debeRestringirReabierto =
    esTicketReabierto &&
    puedeVerCompleto &&
    !puedeEditarSinRestriccion;

  const originalesPorId =
    new Map(
      filasOriginales.map((fila) => [
        fila.id,
        fila,
      ])
    );

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
        "Datos de la tabla guardados correctamente"
      );

      setTablaExpandida(false);

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
    <div className="mt-5 min-w-0 max-w-full border-t pt-4">
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

      <div
        className={
          tablaExpandida
            ? "fixed inset-0 z-50 flex flex-col overflow-hidden bg-white p-4"
            : "w-full min-w-0 max-w-[calc(100vw-22rem)] overflow-hidden rounded-xl border bg-white max-lg:max-w-[calc(100vw-2rem)]"
        }
      >
        <div
          className={
            tablaExpandida
              ? "min-h-0 flex-1 w-full overflow-auto rounded-xl border"
              : "max-h-[42vh] w-full overflow-auto"
          }
        >
        <div
          className={
            puedeVerCompleto
              ? "w-[1800px] max-w-none"
              : "w-[1240px] max-w-none"
          }
        >
        <table className="w-full table-fixed border-collapse text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="sticky top-0 z-10 w-32 border bg-gray-100 p-2 text-left">
                Fecha solicitud
              </th>
              {!puedeVerCompleto && (
                <th className="sticky top-0 z-10 w-32 border bg-gray-100 p-2 text-left">
                  Fecha respuesta
                </th>
              )}
              {puedeVerCompleto && (
                <>
                  <th className="sticky top-0 z-10 w-32 border bg-gray-100 p-2 text-left">
                    Fecha respuesta
                  </th>
                  <th className="sticky top-0 z-10 w-24 border bg-gray-100 p-2 text-left">
                    EAI
                  </th>
                </>
              )}
              <th className="sticky top-0 z-10 w-64 border bg-gray-100 p-2 text-left">
                Nombres y apellidos
              </th>
              <th className="sticky top-0 z-10 w-32 border bg-gray-100 p-2 text-left">
                Tipo documento
              </th>
              <th className="sticky top-0 z-10 w-36 border bg-gray-100 p-2 text-left">
                Identificacion
              </th>
              <th className="sticky top-0 z-10 w-40 border bg-gray-100 p-2 text-left">
                Fecha expedicion
              </th>
              <th className="sticky top-0 z-10 w-72 border bg-gray-100 p-2 text-left">
                Observacion
              </th>

              {puedeVerCompleto && (
                <>
                  <th className="sticky top-0 z-10 w-56 border bg-gray-100 p-2 text-left">
                    Revisado por
                  </th>
                  <th className="sticky top-0 z-10 w-44 border bg-gray-100 p-2 text-left">
                    Motivo
                  </th>
                  <th className="sticky top-0 z-10 w-40 border bg-gray-100 p-2 text-left">
                    Autorizacion
                  </th>
                  <th className="sticky top-0 z-10 w-72 border bg-gray-100 p-2 text-left">
                    Observaciones
                  </th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {filas.map((fila) => {
              const requiereMotivo =
                esObservacionCriticaAntecedente(
                  fila.observacion
                );

              const puedeCorregirDocumento =
                puedeVerCompleto &&
                esObservacionDocumentoNoCorresponde(
                  fila.observacion
                );

              const original =
                originalesPorId.get(fila.id);

              const documentoCorregido =
                Boolean(
                  original &&
                  (
                    fila.identificacion !==
                      original.identificacion ||
                    fila.fechaExpedicionDocumento !==
                      original
                        .fechaExpedicionDocumento
                  )
                );

              const filaPendienteGestion =
                !String(
                  fila.observacion || ""
                ).trim();

              const puedeGestionarFila =
                puedeVerCompleto &&
                (
                  !debeRestringirReabierto ||
                  filaPendienteGestion ||
                  (
                    puedeCorregirDocumento &&
                    documentoCorregido
                  )
                );

              return (
              <tr
                key={fila.id}
                className={claseFilaPorObservacion(
                  fila.observacion
                )}
              >
                <td className="w-32 border p-2">
                  {formatearFechaTabla(
                    fila.fechaSolicitud
                  )}
                </td>
                {!puedeVerCompleto && (
                  <td className="w-32 border p-2">
                    {formatearFechaTabla(
                      fila.fechaRespuesta
                    )}
                  </td>
                )}
                {puedeVerCompleto && (
                  <>
                    <td className="w-32 border p-2">
                      {formatearFechaTabla(
                        fila.fechaRespuesta
                      )}
                    </td>
                    <td className="w-24 border p-2">
                      <span className="block rounded-md border border-gray-200 bg-gray-100 px-2 py-2 text-sm font-semibold text-gray-700">
                        {fila.eai || ""}
                      </span>
                    </td>
                  </>
                )}
                <td className="w-64 border p-2">
                  {fila.nombresApellidos || ""}
                </td>
                <td className="w-32 border p-2">
                  {fila.tipoDocumento || ""}
                </td>
                <td className="w-36 border p-2">
                  {puedeCorregirDocumento ? (
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        value={fila.identificacion}
                        onChange={(event) =>
                          actualizarFila(
                            fila.id,
                            "identificacion",
                            soloNumeros(
                              event.target.value
                            )
                          )
                        }
                        className="w-full rounded-md border p-2 text-sm"
                        placeholder="Nueva identificacion"
                      />
                      <span className="text-[11px] font-semibold text-green-900">
                        Editable por correccion
                      </span>
                    </div>
                  ) : (
                    fila.identificacion
                  )}
                </td>
                <td className="w-40 border p-2">
                  {puedeCorregirDocumento ? (
                    <div className="flex flex-col gap-1">
                      <input
                        type="date"
                        value={fechaParaInput(
                          fila
                            .fechaExpedicionDocumento
                        )}
                        onChange={(event) =>
                          actualizarFila(
                            fila.id,
                            "fechaExpedicionDocumento",
                            event.target.value
                          )
                        }
                        className="w-full rounded-md border p-2 text-sm"
                      />
                      <span className="text-[11px] font-semibold text-green-900">
                        Se habilita reenvio
                      </span>
                    </div>
                  ) : (
                    formatearFechaTabla(
                      fila
                        .fechaExpedicionDocumento
                    )
                  )}
                </td>
                <td className="w-72 border p-2">
                  {puedeGestionarFila ? (
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
                    <td className="w-56 border p-2">
                      {puedeGestionarFila ? (
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
                      ) : (
                        fila.revisadoPor || ""
                      )}
                    </td>
                    <td className="w-44 border p-2">
                      {puedeGestionarFila ? (
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
                      ) : (
                        fila.motivo || ""
                      )}
                    </td>
                    <td className="w-40 border p-2">
                      {puedeGestionarFila ? (
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
                      ) : (
                        fila.autorizacion || ""
                      )}
                    </td>
                    <td className="w-72 border p-2">
                      {puedeGestionarFila ? (
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
                        className="h-20 w-full resize-none rounded-md border p-2 text-sm"
                        placeholder="Observaciones internas"
                      />
                      {requiereMotivo && (
                        <span className="text-xs font-semibold">
                          Obligatorio
                        </span>
                      )}
                      </div>
                      ) : (
                        fila.observaciones || ""
                      )}
                    </td>
                  </>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        </div>

      {puedeVerCompleto && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-gray-50 p-3">
          <button
            type="button"
            onClick={() =>
              setTablaExpandida(
                (actual) => !actual
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-100"
          >
            {tablaExpandida
              ? "↑ Contraer tabla"
              : "↓ Expandir tabla"}
          </button>

          <button
            type="button"
            onClick={guardarTodo}
            disabled={guardandoTodo}
            className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {guardandoTodo
              ? "Guardando datos..."
              : "Guardar datos tabla"}
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
