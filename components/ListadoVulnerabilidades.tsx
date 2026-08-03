"use client";

import Link
from "next/link";

import EliminarVulnerabilidadButton
from "@/components/EliminarVulnerabilidadButton";

type InformeResumen = {
  id: number;
  consecutivo?: string | null;
  eai: string;
  fecha: string | Date;
  actoInseguro: string;
  estado: string;
  supervisor: string;
  reportadoPor?: string | null;
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

export default function ListadoVulnerabilidades({
  informes,
  pagina,
  totalPaginas,
  puedeEliminar = false,
  parametroPagina = "pagina",
}: {
  informes: InformeResumen[];
  pagina: number;
  totalPaginas: number;
  puedeEliminar?: boolean;
  parametroPagina?: string;
}) {
  if (informes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-white p-6 text-sm text-gray-500">
        No hay analisis de vulnerabilidad para mostrar.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3">
        {informes.map((informe) => {
          const abierto =
            informe.estado !==
            "CERRADO";

          return (
            <div
              key={informe.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-[#0F3D1F]">
                      {informe.consecutivo || `#${informe.id}`}
                    </h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      abierto
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {informe.estado}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-slate-600 md:grid-cols-4">
                    <p>
                      <strong>Finca:</strong>{" "}
                      {informe.eai}
                    </p>
                    <p>
                      <strong>Fecha:</strong>{" "}
                      {formatearFecha(
                        informe.fecha
                      )}
                    </p>
                    <p>
                      <strong>Acto:</strong>{" "}
                      {informe.actoInseguro}
                    </p>
                    <p>
                      <strong>Reporta:</strong>{" "}
                      {informe.reportadoPor ||
                        informe.supervisor}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {puedeEliminar && (
                    <EliminarVulnerabilidadButton
                      id={
                        informe.id
                      }
                    />
                  )}

                  <Link
                    href={`/vulnerabilidades/${informe.id}`}
                    className="rounded-lg bg-[#0F3D1F] px-4 py-2 text-sm font-bold text-white hover:bg-[#14532d]"
                  >
                    Ver analisis
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {totalPaginas > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-md">
          <Link
            href={`/vulnerabilidades?${parametroPagina}=${Math.max(
              1,
              pagina - 1
            )}`}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
              pagina <= 1
                ? "pointer-events-none opacity-40"
                : "hover:bg-slate-100"
            }`}
          >
            Anterior
          </Link>

          <span className="text-sm font-semibold text-slate-600">
            Pagina {pagina} de {totalPaginas}
          </span>

          <Link
            href={`/vulnerabilidades?${parametroPagina}=${Math.min(
              totalPaginas,
              pagina + 1
            )}`}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
              pagina >= totalPaginas
                ? "pointer-events-none opacity-40"
                : "hover:bg-slate-100"
            }`}
          >
            Siguiente
          </Link>
        </div>
      )}
    </div>
  );
}
