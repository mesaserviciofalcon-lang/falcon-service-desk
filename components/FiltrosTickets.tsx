"use client";

import {

  useEffect,

  useMemo,

  useState,

} from "react";

import Link
from "next/link";

function obtenerFincaTicket(
  solicitud: any
) {
  return (
    solicitud?.cctv?.fincaEAI ||
    solicitud?.visita?.fincaEAI ||
    solicitud?.radio?.fincaEAI ||
    solicitud?.antecedente?.fincaEAI ||
    solicitud?.novedad?.fincaEAI ||
    "Sin finca"
  );
}

function formatearFecha(
  fecha: Date | string
) {
  return new Date(fecha)
    .toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
}

export default function FiltrosTickets({

  solicitudes,

  role,

  session,

}: any) {

  const [

    busqueda,

    setBusqueda,

  ] = useState("");

  const [

    estado,

    setEstado,

  ] = useState("");

  const [

    tipo,

    setTipo,

  ] = useState("");

  const [

    paginaActual,

    setPaginaActual,

  ] = useState(1);

  const ticketsPorPagina =
    10;

  const ticketsFiltrados =
    useMemo(() => {

      return solicitudes.filter(
        (solicitud: any) => {

          const texto = `

            ${solicitud.id}

            ${solicitud.tipo}

            ${solicitud.solicitante}

            ${solicitud.estado}

            ${solicitud?.cctv?.fincaEAI || ""}

            ${solicitud?.visita?.fincaEAI || ""}

            ${solicitud?.radio?.fincaEAI || ""}

            ${solicitud?.antecedente?.fincaEAI || ""}

            ${solicitud?.novedad?.fincaEAI || ""}

          `.toLowerCase();

          const coincideBusqueda =

            texto.includes(
              busqueda.toLowerCase()
            );

          const coincideEstado =

            estado === ""

            ||

            solicitud.estado ===
              estado;

          const coincideTipo =

            tipo === ""

            ||

            solicitud.tipo ===
              tipo;

          return (

            coincideBusqueda

            &&

            coincideEstado

            &&

            coincideTipo
          );
        }
      );

    },

    [
      solicitudes,
      busqueda,
      estado,
      tipo,
    ]
  );

  useEffect(() => {

    setPaginaActual(1);

  },

  [
    busqueda,
    estado,
    tipo,
  ]);

  const indiceInicial =

    (
      paginaActual - 1
    )

    *

    ticketsPorPagina;

  const indiceFinal =

    indiceInicial +

    ticketsPorPagina;

  const ticketsPaginados =

    ticketsFiltrados.slice(

      indiceInicial,

      indiceFinal
    );

  const totalPaginas =

    Math.ceil(

      ticketsFiltrados.length

      /

      ticketsPorPagina
    );

  return (

    <div>

      {/* FILTROS */}

      <div className="flex flex-wrap gap-4 mb-6">

        <input

          type="text"

          placeholder="Buscar ticket..."

          value={busqueda}

          onChange={(e) =>
            setBusqueda(
              e.target.value
            )
          }

          className="border rounded-lg p-3 w-72"
        />

        <select

          value={estado}

          onChange={(e) =>
            setEstado(
              e.target.value
            )
          }

          className="border rounded-lg p-3"
        >

          <option value="">
            Todos los estados
          </option>

          <option value="PENDIENTE">
            Pendiente
          </option>

          <option value="EN PROCESO">
            En proceso
          </option>

          <option value="COMPLETADO">
            Completado
          </option>

          <option value="REABIERTO">
            Reabierto
          </option>

        </select>

        <select

          value={tipo}

          onChange={(e) =>
            setTipo(
              e.target.value
            )
          }

          className="border rounded-lg p-3"
        >

          <option value="">
            Todos los tipos
          </option>

          <option value="CCTV">
            CCTV
          </option>

          <option value="RADIOS">
            RADIOS
          </option>

          <option value="VISITA DOMICILIARIA">
            VISITA
          </option>

          <option value="ANTECEDENTES">
            ANTECEDENTES
          </option>

          <option value="NOVEDAD SEGURIDAD">
            NOVEDAD
          </option>

        </select>

      </div>

      {/* TOTAL */}

      <p className="mb-6 text-gray-500">

        Tickets encontrados:

        {" "}

        <strong>
          {ticketsFiltrados.length}
        </strong>

      </p>

      {/* LISTADO */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">

        <div className="hidden grid-cols-[90px_1.2fr_1fr_1fr_120px_110px] gap-3 border-b bg-slate-100 px-4 py-3 text-xs font-bold uppercase text-slate-600 md:grid">
          <span>Ticket</span>
          <span>Tipo</span>
          <span>Finca</span>
          <span>Solicitante</span>
          <span>Estado</span>
          <span>Accion</span>
        </div>

        {ticketsPaginados.length === 0 && (
          <div className="p-6 text-sm text-gray-500">
            No hay tickets para mostrar.
          </div>
        )}

        {ticketsPaginados.map((solicitud: any) => (
          <div
            key={solicitud.id}
            className="grid gap-2 border-b px-4 py-4 text-sm last:border-b-0 md:grid-cols-[90px_1.2fr_1fr_1fr_120px_110px] md:items-center md:gap-3"
          >
            <div className="font-bold text-[#0F3D1F]">
              #{solicitud.id}
            </div>

            <div>
              <p className="font-semibold">
                {solicitud.tipo}
              </p>
              <p className="text-xs text-gray-500">
                {formatearFecha(
                  solicitud.fechaCreacion
                )}
              </p>
            </div>

            <div>
              {obtenerFincaTicket(
                solicitud
              )}
            </div>

            <div className="truncate">
              {solicitud.solicitante}
            </div>

            <div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {solicitud.estado}
              </span>
            </div>

            <Link
              href={`/tickets/${solicitud.id}`}
              className="inline-flex justify-center rounded-lg bg-[#0F3D1F] px-3 py-2 text-xs font-semibold text-white hover:bg-[#14532d]"
            >
              Ver ticket
            </Link>
          </div>
        ))}

      </div>

      {/* PAGINACION */}

      <div className="flex gap-3 justify-center mt-8">

        <button

          onClick={() =>
            setPaginaActual(
              paginaActual - 1
            )
          }

          disabled={
            paginaActual === 1
          }

          className="bg-gray-200 px-4 py-2 rounded disabled:opacity-50"
        >

          Anterior

        </button>

        <span className="flex items-center font-semibold">

          Página

          {" "}

          {paginaActual}

          {" "}

          de

          {" "}

          {totalPaginas || 1}

        </span>

        <button

          onClick={() =>
            setPaginaActual(
              paginaActual + 1
            )
          }

          disabled={
            paginaActual ===
            totalPaginas

            ||

            totalPaginas === 0
          }

          className="bg-gray-200 px-4 py-2 rounded disabled:opacity-50"
        >

          Siguiente

        </button>

      </div>

    </div>
  );
}
