"use client";

import {

  useEffect,

  useMemo,

  useState,

} from "react";

import TicketCard
from "@/components/TicketCard";

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

      <div className="grid gap-4">

        {ticketsPaginados.map(
          (solicitud: any) => (

            <TicketCard

              key={solicitud.id}

              solicitud={solicitud}

              role={role}

              session={session}

              mostrarTablaAntecedentes={false}

            />
          )
        )}

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
