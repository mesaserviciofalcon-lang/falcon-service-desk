"use client";

import { useMemo, useState }
from "react";

import { useSession }
from "next-auth/react";

import Link
from "next/link";

import toast
from "react-hot-toast";

import {
  autorizacionAntecedenteOpciones,
  motivoAntecedenteOpciones,
  observacionAntecedenteOpciones,
  puedeEditarAntecedenteSinRestriccion,
  revisadoPorOpciones,
} from "@/lib/antecedentesCatalogos";

import {
  esObservacionCriticaAntecedente,
  esObservacionDocumentoNoCorresponde,
  validarRegistroAntecedente,
} from "@/lib/validacionAntecedentesGestion";

type RegistroMasivo = {
  id: number;
  solicitudId: number;
  ticketEstado: string;
  finca: string;
  solicitante: string;
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
  tusdatosBatchId?: string | null;
  tusdatosJobId?: string | null;
  tusdatosBatchNumber?: number | null;
  tusdatosEstado?: string | null;
  tusdatosEnviadoAt?: string | null;
};

type TicketMasivo = {
  id: number;
  finca: string;
  solicitante: string;
  estado: string;
  totalRegistros: number;
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

export default function GestionMasivaAntecedentes({
  tickets,
  registros,
  role,
}: {
  tickets: TicketMasivo[];
  registros: RegistroMasivo[];
  role?: string | null;
}) {
  const { data: session } =
    useSession();

  const revisadoPorAutomatico =
    session?.user?.name ||
    session?.user?.email ||
    "";
  const [ticketsSeleccionados, setTicketsSeleccionados] =
    useState<number[]>([]);

  const [filas, setFilas] =
    useState(registros);

  const [filasOriginales] =
    useState(registros);

  const [guardando, setGuardando] =
    useState(false);

  const [enviandoTusDatos, setEnviandoTusDatos] =
    useState(false);

  const [tablaExpandida, setTablaExpandida] =
    useState(false);

  const puedeEditarSinRestriccion =
    puedeEditarAntecedenteSinRestriccion(
      role
    );

  const originalesPorId =
    new Map(
      filasOriginales.map((fila) => [
        fila.id,
        fila,
      ])
    );

  const filasVisibles =
    useMemo(
      () =>
        filas.filter((fila) =>
          ticketsSeleccionados.includes(
            fila.solicitudId
          )
        ),
      [
        filas,
        ticketsSeleccionados,
      ]
    );

  const filasPendientesTusDatos =
    useMemo(
      () =>
        filasVisibles.filter(
          (fila) =>
            !fila.observacion?.trim() &&
            !fila.tusdatosBatchId
        ),
      [filasVisibles]
    );

  const filasEnviadasTusDatos =
    useMemo(
      () =>
        filasVisibles.filter(
          (fila) =>
            !fila.observacion?.trim() &&
            fila.tusdatosBatchId
        ),
      [filasVisibles]
    );

  function alternarTicket(
    ticketId: number
  ) {
    setTicketsSeleccionados(
      (actuales) =>
        actuales.includes(ticketId)
          ? actuales.filter(
              (id) => id !== ticketId
            )
          : [
              ...actuales,
              ticketId,
            ]
    );
  }

  function seleccionarTodos() {
    setTicketsSeleccionados(
      tickets.map((ticket) => ticket.id)
    );
  }

  function limpiarSeleccion() {
    setTicketsSeleccionados([]);
  }

  function actualizarFila(
    id: number,
    campo: keyof RegistroMasivo,
    valor: string
  ) {
    setFilas((actuales) =>
      actuales.map((fila) =>
        campo === "revisadoPor" &&
        ticketsSeleccionados.includes(
          fila.solicitudId
        )
          ? {
              ...fila,
              revisadoPor: valor,
            }
          : fila.id === id
          ? {
              ...fila,
              [campo]: valor,
            }
          : fila
      )
    );
  }

  async function descargarExcelTusDatos() {
    if (filasVisibles.length === 0) {
      toast.error(
        "Debe seleccionar al menos un ticket"
      );
      return;
    }

    if (
      filasPendientesTusDatos.length === 0
    ) {
      toast.error(
        "No hay personas pendientes por consultar en TusDatos"
      );
      return;
    }

    const incompleta =
      filasPendientesTusDatos.find(
        (fila) =>
          !fila.identificacion?.trim() ||
          !fila.tipoDocumento?.trim() ||
          !fila
            .fechaExpedicionDocumento
            ?.trim()
      );

    if (incompleta) {
      toast.error(
        `La identificacion ${incompleta.identificacion || "sin numero"} tiene datos incompletos para TusDatos`
      );
      return;
    }

    const XLSX =
      await import("xlsx");

    const worksheet =
      XLSX.utils.aoa_to_sheet([
        [
          "Documento",
          "Tipo de Documento",
          "Fecha de Expedición del Documento (opcional)",
        ],
        ...filasPendientesTusDatos.map(
          (fila) => [
            fila.identificacion,
            fila.tipoDocumento || "",
            formatearFechaTabla(
              fila
                .fechaExpedicionDocumento
            ),
          ]
        ),
      ]);

    worksheet["!cols"] = [
      {
        wch: 22,
      },
      {
        wch: 22,
      },
      {
        wch: 42,
      },
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "CC, CE, NIT, PPT, NOMBRE"
    );

    XLSX.writeFile(
      workbook,
      `TusDatos_antecedentes_${new Date().toISOString().slice(0, 10)}.xlsx`
    );

    toast.success(
      `Excel TusDatos generado con ${filasPendientesTusDatos.length} registros`
    );
  }

  async function enviarTusDatos() {
    try {
      if (filasVisibles.length === 0) {
        toast.error(
          "Debe seleccionar al menos un ticket"
        );
        return;
      }

      if (
        filasPendientesTusDatos.length === 0
      ) {
        toast.error(
          "No hay personas nuevas pendientes por enviar a Tusdatos"
        );
        return;
      }

      const incompleta =
        filasPendientesTusDatos.find(
          (fila) =>
            !fila.identificacion?.trim() ||
            !fila.tipoDocumento?.trim() ||
            !fila
              .fechaExpedicionDocumento
              ?.trim()
        );

      if (incompleta) {
        toast.error(
          `La identificacion ${incompleta.identificacion || "sin numero"} tiene datos incompletos para Tusdatos`
        );
        return;
      }

      setEnviandoTusDatos(true);

      const response =
        await fetch(
          "/api/antecedentes/tusdatos",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              ids:
                filasPendientesTusDatos.map(
                  (fila) => fila.id
                ),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        const detalle =
          data.mensaje ||
          data.detalle?.message ||
          data.detalle?.detail ||
          data.detalle?.error;

        throw new Error(
          [
            data.error,
            detalle,
          ]
            .filter(Boolean)
            .join(": ") ||
          "No se pudo enviar el lote a Tusdatos"
        );
      }

      setFilas((actuales) =>
        actuales.map((fila) =>
          filasPendientesTusDatos.some(
            (pendiente) =>
              pendiente.id === fila.id
          )
            ? {
                ...fila,
                tusdatosBatchId:
                  data.batchId ||
                  "ENVIADO",
                tusdatosJobId:
                  data.jobId ||
                  null,
                tusdatosBatchNumber:
                  data.batchNumber ||
                  null,
                tusdatosEstado:
                  data.jobStatus ||
                  "ENVIADO",
                tusdatosEnviadoAt:
                  new Date().toISOString(),
              }
            : fila
        )
      );

      toast.success(
        `Lote enviado a Tusdatos: ${data.enviados} registro(s). El resultado llegara por correo.`
      );

    } catch (error: any) {
      console.error(error);

      toast.error(
        error.message ||
        "Error enviando a Tusdatos"
      );

    } finally {
      setEnviandoTusDatos(false);
    }
  }

  async function guardarGestionMasiva() {
    try {
      if (filasVisibles.length === 0) {
        toast.error(
          "Debe seleccionar al menos un ticket"
        );
        return;
      }

      const errorValidacion =
        filasVisibles
          .map((fila) =>
            validarRegistroAntecedente({
              ...fila,
              revisadoPor:
                role === "SUPERVISOR"
                  ? revisadoPorAutomatico
                  : fila.revisadoPor,
            })
          )
          .find(Boolean);

      if (errorValidacion) {
        toast.error(errorValidacion);
        return;
      }

      setGuardando(true);

      const response =
        await fetch(
          "/api/antecedentes/guardar-masivo",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              registros:
                filasVisibles,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "No se pudo guardar la gestion masiva"
        );
      }

      setFilas((actuales) =>
        actuales.map((fila) =>
          ticketsSeleccionados.includes(
            fila.solicitudId
          )
            ? data.registros?.find(
                (registro: RegistroMasivo) =>
                  registro.id === fila.id
              ) || {
                ...fila,
                fechaRespuesta:
                  data.fechaRespuesta ||
                  fila.fechaRespuesta,
              }
            : fila
        )
      );

      toast.success(
        `Gestion masiva guardada: ${data.actualizados} registros`
      );

      setTablaExpandida(false);

    } catch (error: any) {
      console.error(error);

      toast.error(
        error.message ||
        "Error guardando gestion masiva"
      );

    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">
              Tickets disponibles
            </h2>
            <p className="text-sm text-gray-500">
              Seleccione uno o varios tickets para consolidar la gestion.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={seleccionarTodos}
              className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-100"
            >
              Seleccionar todos
            </button>

            <button
              type="button"
              onClick={limpiarSeleccion}
              className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-100"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tickets.map((ticket) => {
            const seleccionado =
              ticketsSeleccionados.includes(
                ticket.id
              );

            return (
              <label
                key={ticket.id}
                className={`
                  flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition
                  ${
                    seleccionado
                      ? "border-[#0F7A3B] bg-green-50"
                      : "bg-white hover:bg-gray-50"
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={seleccionado}
                  onChange={() =>
                    alternarTicket(ticket.id)
                  }
                  className="mt-1 h-4 w-4"
                />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="font-bold text-blue-700 hover:underline"
                    >
                      #{ticket.id}
                    </Link>

                    <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold">
                      {ticket.estado}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-sm font-semibold text-gray-800">
                    {ticket.finca}
                  </p>

                  <p className="text-xs text-gray-500">
                    {ticket.totalRegistros}
                    {" "}
                    registros
                    {" - "}
                    {ticket.solicitante}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">
              Tabla consolidada
            </h2>
            <p className="text-sm text-gray-500">
              Registros seleccionados:
              {" "}
              <strong>
                {filasVisibles.length}
              </strong>
              {" "}
              | Pendientes TusDatos:
              {" "}
              <strong>
                {filasPendientesTusDatos.length}
              </strong>
              {" "}
              | Enviadas:
              {" "}
              <strong>
                {filasEnviadasTusDatos.length}
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={enviarTusDatos}
              disabled={
                enviandoTusDatos ||
                filasPendientesTusDatos.length === 0
              }
              className="rounded-lg bg-[#0F7A3B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B5F2E] disabled:bg-gray-400"
            >
              {enviandoTusDatos
                ? "Enviando..."
                : "Enviar a Tusdatos"}
            </button>

            <button
              type="button"
              onClick={descargarExcelTusDatos}
              disabled={
                filasPendientesTusDatos.length === 0
              }
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-400"
            >
              Descargar respaldo Excel
            </button>
          </div>
        </div>

        {filasVisibles.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
            Seleccione uno o varios tickets para ver la tabla consolidada.
          </div>
        ) : (
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
                  : "max-h-[50vh] w-full overflow-auto"
              }
            >
              <div className="w-[2100px] max-w-none">
                <table className="w-full table-fixed border-collapse text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="sticky top-0 z-10 w-24 border bg-gray-100 p-2 text-left">
                        Ticket
                      </th>
                      <th className="sticky top-0 z-10 w-28 border bg-gray-100 p-2 text-left">
                        Finca
                      </th>
                      <th className="sticky top-0 z-10 w-32 border bg-gray-100 p-2 text-left">
                        Fecha solicitud
                      </th>
                      <th className="sticky top-0 z-10 w-32 border bg-gray-100 p-2 text-left">
                        Fecha respuesta
                      </th>
                      <th className="sticky top-0 z-10 w-24 border bg-gray-100 p-2 text-left">
                        EAI
                      </th>
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
                    </tr>
                  </thead>

                  <tbody>
                    {filasVisibles.map((fila) => {
                      const requiereMotivo =
                        esObservacionCriticaAntecedente(
                          fila.observacion
                        );

                      const puedeCorregirDocumento =
                        esObservacionDocumentoNoCorresponde(
                          fila.observacion
                        );

                      const original =
                        originalesPorId.get(
                          fila.id
                        );

                      const documentoCorregido =
                        Boolean(
                          original &&
                          (
                            fila.identificacion !==
                              original.identificacion ||
                            fila
                              .fechaExpedicionDocumento !==
                              original
                                .fechaExpedicionDocumento
                          )
                        );

                      const filaPendienteGestion =
                        !String(
                          fila.observacion || ""
                        ).trim();

                      const ticketReabierto =
                        String(
                          fila.ticketEstado || ""
                        )
                          .trim()
                          .toUpperCase() ===
                        "REABIERTO";

                      const puedeGestionarFila =
                        !ticketReabierto ||
                        puedeEditarSinRestriccion ||
                        filaPendienteGestion ||
                        (
                          puedeCorregirDocumento &&
                          documentoCorregido
                        );

                      return (
                        <tr
                          key={fila.id}
                          className={claseFilaPorObservacion(
                            fila.observacion
                          )}
                        >
                          <td className="w-24 border p-2">
                            <Link
                              href={`/tickets/${fila.solicitudId}`}
                              className="font-bold text-blue-700 hover:underline"
                            >
                              #{fila.solicitudId}
                            </Link>
                          </td>
                          <td className="w-28 border p-2">
                            {fila.finca}
                          </td>
                          <td className="w-32 border p-2">
                            {formatearFechaTabla(
                              fila.fechaSolicitud
                            )}
                          </td>
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
                          <td className="w-64 border p-2">
                            {fila.nombresApellidos || ""}
                          </td>
                          <td className="w-32 border p-2">
                            <span className="block rounded-md border border-gray-200 bg-gray-100 px-2 py-2 text-sm font-semibold text-gray-700">
                              {fila.tipoDocumento || ""}
                            </span>
                          </td>
                          <td className="w-36 border p-2">
                            {puedeCorregirDocumento ? (
                              <div className="flex flex-col gap-1">
                                <input
                                  type="text"
                                  value={
                                    fila.identificacion
                                  }
                                  onChange={(event) =>
                                    actualizarFila(
                                      fila.id,
                                      "identificacion",
                                      soloNumeros(
                                        event.target
                                          .value
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
                            <div className="flex flex-col gap-1">
                              {puedeGestionarFila ? (
                                <SelectCampo
                                value={fila.observacion}
                                options={observacionAntecedenteOpciones}
                                onChange={(value) =>
                                  actualizarFila(
                                    fila.id,
                                    "observacion",
                                    value
                                  )
                                }
                              />
                              ) : (
                                <span>
                                  {fila.observacion ||
                                    ""}
                                </span>
                              )}
                              {puedeGestionarFila && (
                                <span className="text-xs font-semibold">
                                  Obligatorio
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="w-56 border p-2">
                            <div className="flex flex-col gap-1">
                              {puedeGestionarFila && role === "SUPERVISOR" ? (
                                <input
                                  value={revisadoPorAutomatico}
                                  readOnly
                                  className="w-full rounded border bg-slate-100 p-2"
                                />
                              ) : puedeGestionarFila ? (
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
                              ) : (
                                <span>
                                  {fila.revisadoPor ||
                                    ""}
                                </span>
                              )}
                              {puedeGestionarFila && (
                                <span className="text-xs font-semibold">
                                  Obligatorio
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="w-44 border p-2">
                            <div className="flex flex-col gap-1">
                              {puedeGestionarFila ? (
                                <SelectCampo
                                value={fila.motivo}
                                options={motivoAntecedenteOpciones}
                                onChange={(value) =>
                                  actualizarFila(
                                    fila.id,
                                    "motivo",
                                    value
                                  )
                                }
                              />
                              ) : (
                                <span>
                                  {fila.motivo ||
                                    ""}
                                </span>
                              )}
                              {puedeGestionarFila && requiereMotivo && (
                                <span className="text-xs font-semibold">
                                  Obligatorio
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="w-40 border p-2">
                            {puedeGestionarFila ? (
                              <SelectCampo
                              value={fila.autorizacion}
                              options={autorizacionAntecedenteOpciones}
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
                            <div className="flex flex-col gap-1">
                              {puedeGestionarFila ? (
                                <textarea
                                value={fila.observaciones || ""}
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
                              ) : (
                                <span>
                                  {fila.observaciones ||
                                    ""}
                                </span>
                              )}
                              {puedeGestionarFila && requiereMotivo && (
                                <span className="text-xs font-semibold">
                                  Obligatorio
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

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
                  ? "Cerrar ventana"
                  : "Abrir tabla completa"}
              </button>

              <button
                type="button"
                onClick={guardarGestionMasiva}
                disabled={guardando}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {guardando
                  ? "Guardando..."
                  : "Guardar gestion masiva"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
