"use client";

import { useState }
from "react";

import toast
from "react-hot-toast";

import UploadButton
from "@/components/uploadthing/UploadButton";

import { revisadoPorOpciones }
from "@/lib/antecedentesCatalogos";

import {
  procesosVulnerabilidad,
} from "@/lib/vulnerabilidades";

type Archivo = {
  url: string;
  nombre: string;
  tipo?: string;
};

type Informe = {
  id: number;
  consecutivo?: string | null;
  eai: string;
  fecha: string | Date;
  actoInseguro: string;
  vulnerabilidad: string;
  planAccionSugerido: string;
  estado: string;
  supervisor: string;
  reportadoPor?: string | null;
  fotos?: Archivo[];
  cierreObservaciones?: string | null;
  causaRaiz?: string | null;
  proceso?: string | null;
  planAccionEai?: string | null;
  responsables?: string | null;
  fechaEjecucion?: string | null;
  cierreEvidencias?: Archivo[];
  observacionesSeguimiento?: Array<{
    id: number;
    observacion: string;
    supervisor: string;
    usuarioNombre?: string | null;
    usuarioCorreo?: string | null;
    createdAt: string;
  }>;
};

function formatearFecha(
  fecha: string | Date
) {
  return new Date(fecha)
    .toLocaleDateString(
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

function formatearFechaHora(
  fecha: string | Date
) {
  return new Date(fecha)
    .toLocaleString(
      "es-CO",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone:
          "America/Bogota",
      }
    );
}

export default function DetalleVulnerabilidad({
  informe,
  puedeCerrar,
  puedeAgregarObservacion,
}: {
  informe: Informe;
  puedeCerrar: boolean;
  puedeAgregarObservacion: boolean;
}) {
  const [observaciones, setObservaciones] =
    useState("");
  const [evidencias, setEvidencias] =
    useState<Archivo[]>([]);
  const [cerrando, setCerrando] =
    useState(false);
  const [cerrado, setCerrado] =
    useState(
      informe.estado === "CERRADO"
    );
  const [
    observacionesSeguimiento,
    setObservacionesSeguimiento,
  ] = useState(
    informe.observacionesSeguimiento ||
      []
  );
  const [
    observacionSeguimiento,
    setObservacionSeguimiento,
  ] = useState("");
  const [
    supervisorSeguimiento,
    setSupervisorSeguimiento,
  ] = useState(
    informe.reportadoPor ||
      informe.supervisor ||
      ""
  );
  const [
    guardandoObservacion,
    setGuardandoObservacion,
  ] = useState(false);
  const [cierre, setCierre] =
    useState({
      causaRaiz:
        informe.causaRaiz || "",
      proceso:
        informe.proceso || "",
      planAccionEai:
        informe.planAccionEai || "",
      responsables:
        informe.responsables || "",
      fechaEjecucion:
        informe.fechaEjecucion || "",
    });

  function actualizarCierre(
    campo:
      | "causaRaiz"
      | "proceso"
      | "planAccionEai"
      | "responsables"
      | "fechaEjecucion",
    valor: string
  ) {
    setCierre((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  async function cerrarInforme() {
    try {
      setCerrando(true);

      const response =
        await fetch(
          `/api/vulnerabilidades/${informe.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              observaciones,
              evidencias,
              ...cierre,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "No se pudo cerrar"
        );
      }

      setCerrado(true);
      toast.success(
        `Analisis ${informe.consecutivo || `#${informe.id}`} cerrado`
      );
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.message ||
        "Error cerrando analisis"
      );
    } finally {
      setCerrando(false);
    }
  }

  const puedeGestionar =
    !cerrado && puedeCerrar;
  const puedeRegistrarSeguimiento =
    !cerrado &&
    puedeAgregarObservacion;

  async function agregarObservacionSeguimiento() {
    try {
      if (guardandoObservacion) {
        return;
      }

      if (
        !supervisorSeguimiento.trim()
      ) {
        toast.error(
          "Seleccione el supervisor que agrega la observacion"
        );
        return;
      }

      if (
        !observacionSeguimiento.trim()
      ) {
        toast.error(
          "Escriba la observacion de seguimiento"
        );
        return;
      }

      setGuardandoObservacion(true);

      const response =
        await fetch(
          `/api/vulnerabilidades/${informe.id}/observaciones`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              supervisor:
                supervisorSeguimiento,
              observacion:
                observacionSeguimiento,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "No se pudo agregar la observacion"
        );
      }

      setObservacionesSeguimiento(
        (actuales) => [
          {
            id:
              data.observacion.id,
            observacion:
              data.observacion
                .observacion,
            supervisor:
              data.observacion
                .supervisor,
            usuarioNombre:
              data.observacion
                .usuarioNombre,
            usuarioCorreo:
              data.observacion
                .usuarioCorreo,
            createdAt:
              data.observacion
                .createdAt,
          },
          ...actuales,
        ]
      );
      setObservacionSeguimiento("");

      toast.success(
        "Observacion agregada correctamente"
      );
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.message ||
        "Error agregando observacion"
      );
    } finally {
      setGuardandoObservacion(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0F3D1F]">
            Analisis {informe.consecutivo || `#${informe.id}`} - {informe.eai}
          </h2>
          <p className="text-sm text-gray-500">
            {formatearFecha(
              informe.fecha
            )}{" "}
            | {cerrado ? "CERRADO" : informe.estado}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
          cerrado
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800"
        }`}>
          {cerrado ? "CERRADO" : informe.estado}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
        <p>
          <strong>Acto inseguro:</strong>{" "}
          {informe.actoInseguro}
        </p>
        <p>
          <strong>Reportado por:</strong>{" "}
          {informe.reportadoPor ||
            informe.supervisor}
        </p>
      </div>

      <div className="mt-4 rounded-lg border bg-gray-50 p-3 text-sm">
        <p className="font-bold">
          Vulnerabilidad
        </p>
        <p className="mt-1">
          {informe.vulnerabilidad}
        </p>
      </div>

      <div className="mt-3 rounded-lg border bg-green-50 p-3 text-sm">
        <p className="font-bold">
          Acciones tomadas
        </p>
        <p className="mt-1">
          {informe.planAccionSugerido}
        </p>
      </div>

      {informe.fotos &&
        informe.fotos.length > 0 && (
        <div className="mt-3 rounded-lg border bg-gray-50 p-3 text-sm">
          <p className="font-bold">
            Registro fotografico de la novedad
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            {informe.fotos.map((foto) => (
              <a
                key={foto.url}
                href={foto.url}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-lg border bg-white hover:bg-gray-50"
              >
                <img
                  src={foto.url}
                  alt={foto.nombre}
                  className="h-40 w-full object-cover"
                />
                <p className="p-2 text-xs font-semibold text-[#0F3D1F]">
                  {foto.nombre}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      <div
        id="observaciones"
        className="mt-4 rounded-lg border bg-slate-50 p-4 text-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-bold text-[#0F3D1F]">
              Observaciones de seguimiento
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Registre novedades adicionales mientras el analisis permanezca abierto.
            </p>
          </div>
        </div>

        {puedeRegistrarSeguimiento && (
          <div className="mt-3 rounded-lg border bg-white p-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <select
                value={
                  supervisorSeguimiento
                }
                onChange={(event) =>
                  setSupervisorSeguimiento(
                    event.target.value
                  )
                }
                className="rounded-lg border p-3"
              >
                <option value="">
                  Seleccione supervisor
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

              <textarea
                value={
                  observacionSeguimiento
                }
                onChange={(event) =>
                  setObservacionSeguimiento(
                    event.target.value
                  )
                }
                className="min-h-24 rounded-lg border p-3 md:col-span-2"
                placeholder="Observacion de seguimiento"
              />
            </div>

            <button
              type="button"
              onClick={
                agregarObservacionSeguimiento
              }
              disabled={
                guardandoObservacion
              }
              className="mt-3 rounded-lg bg-[#0F3D1F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#14532d] disabled:bg-gray-500"
            >
              {guardandoObservacion
                ? "Guardando..."
                : "Agregar observacion"}
            </button>
          </div>
        )}

        {observacionesSeguimiento.length ===
        0 ? (
          <p className="mt-3 rounded-lg border border-dashed bg-white p-3 text-slate-500">
            Sin observaciones de seguimiento registradas.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {observacionesSeguimiento.map(
              (observacion) => (
                <div
                  key={observacion.id}
                  className="rounded-lg border bg-white p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-[#0F3D1F]">
                      {
                        observacion.supervisor
                      }
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      {formatearFechaHora(
                        observacion.createdAt
                      )}
                    </p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-slate-700">
                    {
                      observacion.observacion
                    }
                  </p>
                  {(observacion.usuarioNombre ||
                    observacion.usuarioCorreo) && (
                    <p className="mt-2 text-xs text-slate-500">
                      Registrado en plataforma por:{" "}
                      {observacion.usuarioNombre ||
                        observacion.usuarioCorreo}
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {puedeGestionar ? (
        <div className="mt-4 border-t pt-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <textarea
              value={cierre.causaRaiz}
              onChange={(event) =>
                actualizarCierre(
                  "causaRaiz",
                  event.target.value
                )
              }
              className="min-h-24 rounded-lg border p-3"
              placeholder="Causa raiz"
            />

            <select
              value={cierre.proceso}
              onChange={(event) =>
                actualizarCierre(
                  "proceso",
                  event.target.value
                )
              }
              className="rounded-lg border p-3"
            >
              <option value="">
                Seleccione proceso
              </option>
              {procesosVulnerabilidad.map(
                (proceso) => (
                  <option
                    key={proceso}
                    value={proceso}
                  >
                    {proceso}
                  </option>
                )
              )}
            </select>

            <input
              value={cierre.responsables}
              onChange={(event) =>
                actualizarCierre(
                  "responsables",
                  event.target.value
                )
              }
              className="rounded-lg border p-3"
              placeholder="Responsables"
            />

            <input
              type="date"
              value={cierre.fechaEjecucion}
              onChange={(event) =>
                actualizarCierre(
                  "fechaEjecucion",
                  event.target.value
                )
              }
              className="rounded-lg border p-3"
            />
          </div>

          <textarea
            value={cierre.planAccionEai}
            onChange={(event) =>
              actualizarCierre(
                "planAccionEai",
                event.target.value
              )
            }
            className="mt-3 min-h-24 w-full rounded-lg border p-3"
            placeholder="Plan de accion EAI"
          />

          <textarea
            value={observaciones}
            onChange={(event) =>
              setObservaciones(
                event.target.value
              )
            }
            className="mt-3 min-h-24 w-full rounded-lg border p-3"
            placeholder="Observaciones de cierre"
          />

          <div className="mt-3 rounded-lg border border-dashed bg-gray-50 p-3">
            <p className="text-sm font-semibold text-gray-700">
              Evidencia de cierre
            </p>
            <UploadButton
              allowedExtensions={[
                "jpg",
                "jpeg",
                "png",
                "webp",
                "pdf",
                "xlsx",
                "xls",
              ]}
              allowedExtensionsLabel="imagenes, PDF o Excel"
              onCompleteMany={(
                archivos: Archivo[]
              ) =>
                setEvidencias(
                  (actuales) => [
                    ...actuales,
                    ...archivos,
                  ]
                )
              }
            />
          </div>

          {evidencias.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {evidencias.map((archivo) => (
                <div
                  key={archivo.url}
                  className="rounded-lg border bg-gray-50 p-2 text-sm"
                >
                  {archivo.nombre}
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={cerrarInforme}
            disabled={cerrando}
            className="mt-4 rounded-md bg-[#0F3D1F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#14532d] disabled:bg-gray-500"
          >
            {cerrando
              ? "Cerrando..."
              : "Cerrar analisis"}
          </button>
        </div>
      ) : cerrado ? (
        <div className="mt-4 rounded-lg border bg-green-50 p-4 text-sm text-green-950">
          <p className="font-bold">
            Gestion de cierre
          </p>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <p>
              <strong>Causa raiz:</strong>{" "}
              {informe.causaRaiz ||
                "No registrada"}
            </p>
            <p>
              <strong>Proceso:</strong>{" "}
              {informe.proceso ||
                "No registrado"}
            </p>
            <p>
              <strong>Responsables:</strong>{" "}
              {informe.responsables ||
                "No registrado"}
            </p>
            <p>
              <strong>Fecha de ejecucion:</strong>{" "}
              {informe.fechaEjecucion ||
                "No registrada"}
            </p>
          </div>

          <div className="mt-3 rounded-lg border border-green-200 bg-white p-3">
            <p className="font-bold">
              Plan de accion EAI
            </p>
            <p className="mt-1 whitespace-pre-wrap">
              {informe.planAccionEai ||
                "No registrado"}
            </p>
          </div>

          <div className="mt-3 rounded-lg border border-green-200 bg-white p-3">
            <p className="font-bold">
              Observaciones de cierre
            </p>
            <p className="mt-1 whitespace-pre-wrap">
              {informe.cierreObservaciones ||
                "Analisis cerrado"}
            </p>
          </div>

          {informe.cierreEvidencias &&
            informe.cierreEvidencias.length >
              0 && (
              <div className="mt-3 rounded-lg border border-green-200 bg-white p-3">
                <p className="font-bold">
                  Evidencias
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  {informe.cierreEvidencias.map(
                    (archivo) => (
                      <a
                        key={
                          archivo.url
                        }
                        href={
                          archivo.url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border bg-gray-50 p-2 text-sm font-semibold text-[#0F3D1F] hover:bg-gray-100"
                      >
                        {archivo.nombre}
                      </a>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border bg-yellow-50 p-3 text-sm text-yellow-900">
          Pendiente de cierre por el Analista SIG asignado.
        </div>
      )}
    </div>
  );
}
