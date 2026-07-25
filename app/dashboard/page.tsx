import { prisma }
from "@/lib/prisma";

import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import Link
from "next/link";

import NumeroAnimado
from "@/components/NumeroAnimado";

import { formatearFechaColombia }
from "@/lib/fecha";

import { solicitantePuedeVerSolicitud }
from "@/lib/visibilidadSolicitudes";

import { ocultarSolicitudesHistoricas }
from "@/lib/solicitudesHistoricas";

import {
  visibleEnBandejaPorRol,
} from "@/lib/visibilidadTickets";

import {
  OBSERVACION_DOCUMENTO_NO_CORRESPONDE,
  OBSERVACION_NO_TENER_EN_CUENTA,
} from "@/lib/validacionAntecedentesGestion";

const OBSERVACION_CONTINUAR =
  "CONTINUAR CON EL PROCESO";

function normalizarTexto(
  valor?: string | null
) {
  return (valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function esConceptoContinuar(
  observacion?: string | null
) {
  const valor =
    normalizarTexto(observacion);

  return [
    normalizarTexto(
      OBSERVACION_CONTINUAR
    ),
    "CONTINUAR EL PROCESO",
  ].includes(valor);
}

function esConceptoNoTenerEnCuenta(
  observacion?: string | null
) {
  return (
    normalizarTexto(observacion) ===
    normalizarTexto(
      OBSERVACION_NO_TENER_EN_CUENTA
    )
  );
}

function esConceptoDocumentoNoCorresponde(
  observacion?: string | null
) {
  const valor =
    normalizarTexto(observacion);

  return (
    valor ===
      normalizarTexto(
        OBSERVACION_DOCUMENTO_NO_CORRESPONDE
      ) ||
    valor.includes(
      "NO CORRESPONDE CON EL NOMBRE"
    ) ||
    valor.includes(
      "NO COINCIDE CON EL NOMBRE"
    )
  );
}

function obtenerFincaTicket(
  ticket: any
) {
  return (
    ticket.cctv?.fincaEAI ||
    ticket.visita?.fincaEAI ||
    ticket.radio?.fincaEAI ||
    ticket.antecedente?.fincaEAI ||
    ticket.novedad?.fincaEAI ||
    "Sin finca"
  );
}

function obtenerMesTicket(
  fecha: Date | string
) {
  return new Date(fecha)
    .toISOString()
    .slice(0, 7);
}

function parsearFechaRegistroIndicador(
  valor?: string | null
) {
  if (!valor) {
    return null;
  }

  const texto =
    valor.trim();

  const fecha =
    new Date(texto);

  if (
    !Number.isNaN(
      fecha.getTime()
    )
  ) {
    return fecha;
  }

  const partes =
    texto.match(
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
    );

  if (!partes) {
    return null;
  }

  const fechaLocal =
    new Date(
      Number(partes[3]),
      Number(partes[2]) - 1,
      Number(partes[1])
    );

  return Number.isNaN(
    fechaLocal.getTime()
  )
    ? null
    : fechaLocal;
}

function obtenerFechaRegistroIndicador(
  registro: {
    fechaRespuesta?: string | null;
    fechaSolicitud?: string | null;
    createdAt: Date;
  }
) {
  return (
    parsearFechaRegistroIndicador(
      registro.fechaRespuesta
    ) ||
    parsearFechaRegistroIndicador(
      registro.fechaSolicitud
    ) ||
    registro.createdAt
  );
}

function obtenerMesRegistroIndicador(
  registro: {
    fechaRespuesta?: string | null;
    fechaSolicitud?: string | null;
    createdAt: Date;
  }
) {
  return obtenerFechaRegistroIndicador(
    registro
  )
    .toISOString()
    .slice(0, 7);
}

type MetricasAntecedentes = {
  total: number;
  continuar: number;
  noTenerEnCuenta: number;
  documentoNoCorresponde: number;
  nacionales: number;
  extranjeros: number;
};

type ConteoMes = {
  mes: string;
};

const metricasAntecedentesVacias: MetricasAntecedentes = {
  total: 0,
  continuar: 0,
  noTenerEnCuenta: 0,
  documentoNoCorresponde: 0,
  nacionales: 0,
  extranjeros: 0,
};

function normalizarConteo(
  valor: unknown
) {
  return Number(valor || 0);
}

async function obtenerMetricasAntecedentes(
  mes?: string,
  anio?: number
) {
  const resultado =
    await prisma.$queryRaw<
      Array<{
        total: bigint | number;
        continuar: bigint | number;
        no_tener_en_cuenta: bigint | number;
        documento_no_corresponde: bigint | number;
        nacionales: bigint | number;
        extranjeros: bigint | number;
      }>
    >`
      WITH registros AS (
        SELECT
          "observacion",
          "tipoDocumento",
          COALESCE(
            CASE
              WHEN "fechaRespuesta" ~ '^\\d{4}-\\d{1,2}-\\d{1,2}'
                THEN "fechaRespuesta"::date
              WHEN "fechaRespuesta" ~ '^\\d{1,2}[/-]\\d{1,2}[/-]\\d{4}$'
                THEN to_date(replace("fechaRespuesta", '-', '/'), 'DD/MM/YYYY')
              ELSE NULL
            END,
            CASE
              WHEN "fechaSolicitud" ~ '^\\d{4}-\\d{1,2}-\\d{1,2}'
                THEN "fechaSolicitud"::date
              WHEN "fechaSolicitud" ~ '^\\d{1,2}[/-]\\d{1,2}[/-]\\d{4}$'
                THEN to_date(replace("fechaSolicitud", '-', '/'), 'DD/MM/YYYY')
              ELSE NULL
            END,
            "createdAt"::date
          ) AS fecha_indicador
        FROM "AntecedenteRegistro"
      ),
      filtrados AS (
        SELECT *
        FROM registros
        WHERE
          (${mes || ""} = '' OR to_char(fecha_indicador, 'YYYY-MM') = ${mes || ""})
          AND
          (${anio || 0} = 0 OR EXTRACT(YEAR FROM fecha_indicador)::int = ${anio || 0})
      )
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (
          WHERE upper(trim("observacion")) IN (
            'CONTINUAR CON EL PROCESO',
            'CONTINUAR EL PROCESO'
          )
        ) AS continuar,
        COUNT(*) FILTER (
          WHERE upper(trim("observacion")) = 'LA PERSONA NO DEBE SER TENIDA EN CUENTA'
        ) AS no_tener_en_cuenta,
        COUNT(*) FILTER (
          WHERE
            upper(trim("observacion")) LIKE '%NO CORRESPONDE CON EL NOMBRE%'
            OR upper(trim("observacion")) LIKE '%NO COINCIDE CON EL NOMBRE%'
        ) AS documento_no_corresponde,
        COUNT(*) FILTER (
          WHERE "tipoDocumento" = 'CC'
        ) AS nacionales,
        COUNT(*) FILTER (
          WHERE "tipoDocumento" IN ('PP', 'PPT', 'CE')
        ) AS extranjeros
      FROM filtrados
    `;

  const fila =
    resultado[0];

  if (!fila) {
    return metricasAntecedentesVacias;
  }

  return {
    total:
      normalizarConteo(fila.total),
    continuar:
      normalizarConteo(fila.continuar),
    noTenerEnCuenta:
      normalizarConteo(
        fila.no_tener_en_cuenta
      ),
    documentoNoCorresponde:
      normalizarConteo(
        fila.documento_no_corresponde
      ),
    nacionales:
      normalizarConteo(
        fila.nacionales
      ),
    extranjeros:
      normalizarConteo(
        fila.extranjeros
      ),
  };
}

async function obtenerMesesAntecedentes(
  anio: number
) {
  const resultado =
    await prisma.$queryRaw<ConteoMes[]>`
      WITH registros AS (
        SELECT
          COALESCE(
            CASE
              WHEN "fechaRespuesta" ~ '^\\d{4}-\\d{1,2}-\\d{1,2}'
                THEN "fechaRespuesta"::date
              WHEN "fechaRespuesta" ~ '^\\d{1,2}[/-]\\d{1,2}[/-]\\d{4}$'
                THEN to_date(replace("fechaRespuesta", '-', '/'), 'DD/MM/YYYY')
              ELSE NULL
            END,
            CASE
              WHEN "fechaSolicitud" ~ '^\\d{4}-\\d{1,2}-\\d{1,2}'
                THEN "fechaSolicitud"::date
              WHEN "fechaSolicitud" ~ '^\\d{1,2}[/-]\\d{1,2}[/-]\\d{4}$'
                THEN to_date(replace("fechaSolicitud", '-', '/'), 'DD/MM/YYYY')
              ELSE NULL
            END,
            "createdAt"::date
          ) AS fecha_indicador
        FROM "AntecedenteRegistro"
      )
      SELECT DISTINCT
        to_char(fecha_indicador, 'YYYY-MM') AS mes
      FROM registros
      WHERE EXTRACT(YEAR FROM fecha_indicador)::int = ${anio}
      ORDER BY mes DESC
    `;

  return resultado.map(
    (fila) => fila.mes
  );
}

function formatearMes(
  mes: string
) {
  const [
    anio,
    numeroMes,
  ] = mes.split("-");

  const fecha =
    new Date(
      Number(anio),
      Number(numeroMes) - 1,
      1
    );

  return fecha.toLocaleDateString(
    "es-CO",
    {
      month: "long",
      year: "numeric",
    }
  );
}

function obtenerMesActual() {
  return new Date()
    .toISOString()
    .slice(0, 7);
}

export default async function DashboardPage({

  searchParams,

}: {

  searchParams?: Promise<{
    estado?: string;
    mes?: string;
  }>;
}) {

  const params =
    await searchParams;

  const estadoSeleccionado =
    params?.estado || "";

  const mesSeleccionado =
    params?.mes || "";

  const mesActual =
    obtenerMesActual();

  const session =
    await getServerSession(
      authOptions
    );

  const role =
    session?.user?.role;

  const email =
    session?.user?.email;

  const fincaEAI =
    session?.user?.fincaEAI;

  // TODOS LOS TICKETS

  const solicitudes =
    ocultarSolicitudesHistoricas(
      await prisma.solicitud.findMany({

      include: {

        cctv: true,

        visita: true,

        radio: true,

        antecedente: true,

        novedad: true,
      },

      orderBy: {
        fechaCreacion:
          "desc",
      },
    })
    );

  // FILTRO POR ROL

  let tickets =
    solicitudes;

const hace5Dias =
  new Date();

hace5Dias.setDate(
  hace5Dias.getDate() - 5
);
  if (role === "SOLICITANTE") {

  tickets =
    solicitudes.filter(
      (s: any) => {

        const visible =

          s.estado !==
            "COMPLETADO"

          ||

          (

            s.fechaCierre &&

            new Date(
              s.fechaCierre
            ) >= hace5Dias
          );

        return (

          solicitantePuedeVerSolicitud(
            s,
            email,
            fincaEAI
          )

          &&

          visible
        );
      }
    );
}

 if (
  role === "TECNICO"

  ||

  role === "JEFE_SEG"

  ||

  role === "DIRECTOR_SEG"
) {

  tickets =
    solicitudes.filter(
      (s: any) => {

        const visible =

          s.estado !==
            "COMPLETADO"

          ||

          (

            s.fechaCierre &&

            new Date(
              s.fechaCierre
            ) >= hace5Dias
          );

        const esSeguridad =

          role === "JEFE_SEG"

          ||

          role === "DIRECTOR_SEG";

        return (

          (

            s.tipo === "CCTV"

            ||

            s.tipo === "RADIOS"

            ||

            (

              esSeguridad

              &&

              s.tipo ===
                "NOVEDAD SEGURIDAD"
            )
          )

          &&

          visible
        );
      }
    );
}

  if (role === "VISITA") {

  tickets =
    solicitudes.filter(
      (s: any) => {

        const visible =

          s.estado !==
            "COMPLETADO"

          ||

          (

            s.fechaCierre &&

            new Date(
              s.fechaCierre
            ) >= hace5Dias
          );

        return (

          s.tipo ===
            "VISITA DOMICILIARIA"

          &&

          visible
        );
      }
    );
}

  if (role === "SUPERVISOR") {

  tickets =
    solicitudes.filter(
      (s: any) => {

        const visible =

          s.estado !==
            "COMPLETADO"

          ||

          (

            s.fechaCierre &&

            new Date(
              s.fechaCierre
            ) >= hace5Dias
          );

        return (

          s.tipo ===
            "ANTECEDENTES"

          &&

          visible
        );
      }
    );
}

  tickets =
    tickets.filter((ticket: any) =>
      visibleEnBandejaPorRol(
        ticket,
        role
      )
    );

  const ticketsMetricas =
    role === "ADMIN"
      ? solicitudes
      : tickets;

  const puedeVerMetricasAntecedentes =
    role === "ADMIN"

    ||

    role === "DIRECTOR_SEG"

    ||

    role === "JEFE_SEG"

    ||

    role === "SUPERVISOR";

  const aplicarFiltroMes =
    role === "ADMIN";

  const mesIndicadores =
    role === "ADMIN"
      ? mesSeleccionado ||
        mesActual
      : "";

  const ticketsMetricasFiltradas =
    aplicarFiltroMes
      ? ticketsMetricas.filter(
          (ticket: any) =>
            obtenerMesTicket(
              ticket.fechaCreacion
            ) ===
            mesIndicadores
        )
      : ticketsMetricas;

  const anioActual =
    new Date().getFullYear();

  const metricasAntecedentesMes =
    puedeVerMetricasAntecedentes
      ? await obtenerMetricasAntecedentes(
          role === "ADMIN"
            ? mesIndicadores
            : undefined
        )
      : metricasAntecedentesVacias;

  const metricasAntecedentesAnio =
    puedeVerMetricasAntecedentes
      ? await obtenerMetricasAntecedentes(
          undefined,
          anioActual
        )
      : metricasAntecedentesVacias;

  const mesesAntecedentesDisponibles =
    role === "ADMIN"
      ? await obtenerMesesAntecedentes(
          anioActual
        )
      : [];

  const mesesDisponibles =
    Array.from(
      new Set(
        [
          ...solicitudes
            .filter(
              (ticket: any) =>
                new Date(
                  ticket.fechaCreacion
                ).getFullYear() ===
                anioActual
            )
            .map(
              (ticket: any) =>
                obtenerMesTicket(
                  ticket.fechaCreacion
                )
            ),
          ...mesesAntecedentesDisponibles,
        ]
      )
    ).sort(
      (a, b) =>
        b.localeCompare(a)
    );

  // CONTADORES

  const pendientes =
    ticketsMetricasFiltradas.filter(
      (s: any) =>

        s.estado ===
        "Pendiente"
    ).length;

  const enProceso =
    ticketsMetricasFiltradas.filter(
      (s: any) =>

        s.estado ===
        "EN PROCESO"
    ).length;

  const reabiertos =
    ticketsMetricasFiltradas.filter(
      (s: any) =>

        s.estado ===
        "REABIERTO"
    ).length;

  const completados =
    ticketsMetricasFiltradas.filter(
      (s: any) =>

        s.estado ===
        "COMPLETADO"
    ).length;

  const ticketsTablaBase =
    aplicarFiltroMes
      ? tickets.filter(
          (ticket: any) =>
            obtenerMesTicket(
              ticket.fechaCreacion
            ) ===
            mesIndicadores
        )
      : tickets;

  const ticketsFiltrados =
    estadoSeleccionado

      ? ticketsTablaBase.filter(
          (s: any) =>
            s.estado ===
            estadoSeleccionado
        )

      : ticketsTablaBase;

  const tarjetasEstado = [
    {
      titulo: "Pendientes",
      estado: "Pendiente",
      total: pendientes,
      color: "border-yellow-500 text-yellow-700 bg-yellow-50",
    },
    {
      titulo: "En proceso",
      estado: "EN PROCESO",
      total: enProceso,
      color: "border-blue-500 text-blue-700 bg-blue-50",
    },
    {
      titulo: "Reabiertos",
      estado: "REABIERTO",
      total: reabiertos,
      color: "border-red-500 text-red-700 bg-red-50",
    },
    {
      titulo: "Completados",
      estado: "COMPLETADO",
      total: completados,
      color: "border-green-500 text-green-700 bg-green-50",
    },
  ];

  const ahora =
    new Date();

  const ticketsAbiertos =
    ticketsMetricasFiltradas.filter(
      (ticket: any) =>
        ticket.estado !==
        "COMPLETADO"
    );

  const ticketsSinGestionMayor48h =
    ticketsAbiertos.filter(
      (ticket: any) =>
        ahora.getTime() -
          new Date(
            ticket.fechaCreacion
          ).getTime() >
        1000 * 60 * 60 * 48
    );

  const ticketMasAntiguo =
    ticketsAbiertos
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(
            a.fechaCreacion
          ).getTime() -
          new Date(
            b.fechaCreacion
          ).getTime()
      )[0];

  const diasTicketMasAntiguo =
    ticketMasAntiguo
      ? Math.max(
          0,
          Math.floor(
            (
              ahora.getTime() -
              new Date(
                ticketMasAntiguo.fechaCreacion
              ).getTime()
            ) /
              (
                1000 *
                60 *
                60 *
                24
              )
          )
        )
      : 0;

  const tiposSolicitud =
    Object.entries(
      ticketsMetricasFiltradas.reduce(
        (
          acumulado: Record<string, number>,
          ticket: any
        ) => {
          acumulado[ticket.tipo] =
            (
              acumulado[ticket.tipo] ||
              0
            ) + 1;

          return acumulado;
        },
        {}
      )
    )
      .map(
        ([tipo, total]) => ({
          tipo,
          total,
        })
      )
      .sort(
        (a, b) =>
          b.total - a.total
      );

  const mayorTipo =
    Math.max(
      ...tiposSolicitud.map(
        (item) => item.total
      ),
      1
    );

  const fincasTop =
    Object.entries(
      ticketsMetricasFiltradas.reduce(
        (
          acumulado: Record<string, number>,
          ticket: any
        ) => {
          const finca =
            obtenerFincaTicket(
              ticket
            );

          acumulado[finca] =
            (
              acumulado[finca] ||
              0
            ) + 1;

          return acumulado;
        },
        {}
      )
    )
      .map(
        ([finca, total]) => ({
          finca,
          total,
        })
      )
      .sort(
        (a, b) =>
          b.total - a.total
      )
      .slice(0, 5);

  const continuarProceso =
    metricasAntecedentesMes.continuar;

  const noPuedeContinuar =
    metricasAntecedentesMes.noTenerEnCuenta;

  const documentoNoCorresponde =
    metricasAntecedentesMes.documentoNoCorresponde;

  const nacionales =
    metricasAntecedentesMes.nacionales;

  const extranjeros =
    metricasAntecedentesMes.extranjeros;

  const totalRegistrosEvaluados =
    metricasAntecedentesMes.total;

  const registrosAntecedentesAnioCurso =
    metricasAntecedentesAnio.total;

  const ticketsSolicitanteActivos =
    tickets.filter(
      (ticket: any) =>
        ticket.estado !==
        "COMPLETADO"
    );

  const ticketsSolicitanteCompletados =
    tickets.filter(
      (ticket: any) =>
        ticket.estado ===
        "COMPLETADO"
    );

  const ticketsSolicitanteConCierre =
    ticketsSolicitanteCompletados.filter(
      (ticket: any) =>
        ticket.fechaCierre
    );

  const promedioRespuestaSolicitante =
    ticketsSolicitanteConCierre.length > 0
      ? Math.round(
          ticketsSolicitanteConCierre.reduce(
            (
              total: number,
              ticket: any
            ) =>
              total +
              (
                new Date(
                  ticket.fechaCierre
                ).getTime() -
                new Date(
                  ticket.fechaCreacion
                ).getTime()
              ) /
                (
                  1000 *
                  60 *
                  60 *
                  24
                ),
            0
          ) /
            ticketsSolicitanteConCierre.length
        )
      : 0;

  const ultimasRespuestasSolicitante =
    ticketsSolicitanteCompletados
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(
            b.fechaCierre ||
              b.fechaCreacion
          ).getTime() -
          new Date(
            a.fechaCierre ||
              a.fechaCreacion
          ).getTime()
      )
      .slice(0, 4);

  return (

    <div className="p-8 bg-[#E8EEF2] min-h-screen">

  <div className="mb-10">

    <h1 className="text-4xl font-bold text-[#0F3D1F]">

      Dashboard

    </h1>

    <p className="text-gray-600 mt-2">

      Falcon Service Desk

    </p>

  </div>

      {role === "ADMIN" && (

        <form
          className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-md"
        >

          <div>

            <label
              htmlFor="mes"
              className="block text-xs font-bold uppercase text-gray-500"
            >
              Indicadores mensuales
            </label>

            <select
              id="mes"
              name="mes"
              defaultValue={
                mesSeleccionado
              }
              className="mt-2 rounded-lg border px-3 py-2 text-sm"
            >

              <option value="">
                General
              </option>

              {mesesDisponibles.map(
                (mes) => (

                  <option
                    key={mes}
                    value={mes}
                  >
                    {formatearMes(mes)}
                  </option>
                )
              )}

            </select>

          </div>

          <button
            type="submit"
            className="rounded-lg bg-[#0F3D1F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B2E17]"
          >
            Ver indicadores
          </button>

          {mesSeleccionado && (

            <Link
              href="/dashboard"
              className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Ver mes en curso
            </Link>
          )}

          <span className="text-sm text-gray-500">
            {mesSeleccionado
              ? `Mostrando ${formatearMes(
                  mesSeleccionado
                )}`
              : `Mostrando mes en curso: ${formatearMes(
                  mesActual
                )}`}
          </span>

        </form>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

        {tarjetasEstado.map(
          (tarjeta) => {

            const activa =
              estadoSeleccionado ===
              tarjeta.estado;

            const queryMes =
              role === "ADMIN" &&
              mesIndicadores
                ? `mes=${encodeURIComponent(
                    mesIndicadores
                  )}`
                : "";

            const hrefQuitarEstado =
              queryMes
                ? `/dashboard?${queryMes}`
                : "/dashboard";

            const hrefAplicarEstado =
              `/dashboard?estado=${encodeURIComponent(
                tarjeta.estado
              )}${
                queryMes
                  ? `&${queryMes}`
                  : ""
              }`;

            return (

              <Link
                key={tarjeta.estado}
                href={
                  activa
                    ? hrefQuitarEstado
                    : hrefAplicarEstado
                }
                className={`
                  rounded-lg
                  border-l-4
                  bg-white
                  p-4
                  shadow-sm
                  transition
                  hover:-translate-y-0.5
                  hover:shadow-md
                  ${tarjeta.color}
                  ${
                    activa
                      ? "ring-2 ring-[#0F3D1F]/20"
                      : ""
                  }
                `}
              >

                <span className="text-xs font-semibold uppercase tracking-normal text-gray-500">
                  {tarjeta.titulo}
                </span>

                <div className="mt-2 flex items-end justify-between gap-3">

                  <strong className="text-3xl leading-none">
                    <NumeroAnimado
                      valor={tarjeta.total}
                    />
                  </strong>

                  <span className="text-xs font-medium text-gray-500">
                    Ver
                  </span>

                </div>

              </Link>
            );
          }
        )}

      </div>

      {puedeVerMetricasAntecedentes && (

        <div className="mb-8 grid grid-cols-1 xl:grid-cols-2 gap-4">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md xl:col-span-2">

            <h2 className="text-sm font-bold uppercase text-gray-500">
              Conceptos de antecedentes
            </h2>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">

              <div className="min-w-0 rounded-lg border bg-green-50 p-4">

                <span className="block text-xs font-semibold uppercase leading-5 text-gray-500">
                  Continuar el proceso
                </span>

                <p className="mt-3 break-words text-4xl font-bold leading-none text-green-700">
                  <NumeroAnimado
                    valor={continuarProceso}
                  />
                </p>

              </div>

              <div className="min-w-0 rounded-lg border bg-yellow-100 p-4">

                <span className="block text-xs font-semibold uppercase leading-5 text-gray-500">
                  No debe ser tenida en cuenta
                </span>

                <p className="mt-3 break-words text-4xl font-bold leading-none text-red-700">
                  <NumeroAnimado
                    valor={noPuedeContinuar}
                  />
                </p>

              </div>

              <div className="min-w-0 rounded-lg border bg-emerald-50 p-4">

                <span className="block text-xs font-semibold uppercase leading-5 text-gray-500">
                  Documento no corresponde
                </span>

                <p className="mt-3 break-words text-4xl font-bold leading-none text-emerald-800">
                  <NumeroAnimado
                    valor={documentoNoCorresponde}
                  />
                </p>

              </div>

            </div>

          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">

            <h2 className="text-sm font-bold uppercase text-gray-500">
              Nacionales y extranjeros
            </h2>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="min-w-0 rounded-lg border bg-blue-50 p-4">

                <span className="block text-xs font-semibold uppercase leading-5 text-gray-500">
                  Nacionales CC
                </span>

                <p className="mt-3 break-words text-4xl font-bold leading-none text-blue-700">
                  <NumeroAnimado
                    valor={nacionales}
                  />
                </p>

              </div>

              <div className="min-w-0 rounded-lg border bg-slate-50 p-4">

                <span className="block text-xs font-semibold uppercase leading-5 text-gray-500">
                  Extranjeros
                </span>

                <span className="mt-1 block text-xs font-semibold uppercase leading-5 text-gray-500">
                  PP, PPT y CE
                </span>

                <p className="mt-3 break-words text-4xl font-bold leading-none text-slate-800">
                  <NumeroAnimado
                    valor={extranjeros}
                  />
                </p>

              </div>

            </div>

            <p className="mt-3 text-xs text-gray-500">
              Total registros evaluados:
              {" "}
              <strong>
                <NumeroAnimado
                  valor={
                    totalRegistrosEvaluados
                  }
                />
              </strong>
            </p>

          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">

            <h2 className="text-sm font-bold uppercase text-gray-500">
              Histórico año en curso
            </h2>

            <div className="mt-4 rounded-lg border bg-gray-50 p-4">

              <span className="block text-xs font-semibold uppercase leading-5 text-gray-500">
                Registros {anioActual}
              </span>

              <p className="mt-3 break-words text-4xl font-bold leading-none text-[#0F3D1F]">
                <NumeroAnimado
                  valor={
                    registrosAntecedentesAnioCurso
                  }
                />
              </p>

            </div>

            <p className="mt-3 text-xs text-gray-500">
              Incluye registros cargados desde la base histórica y registros nuevos del sistema.
            </p>

          </div>

        </div>
      )}

      {role === "SOLICITANTE" && (

        <div className="mb-8 grid grid-cols-1 xl:grid-cols-3 gap-4">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">

            <h2 className="text-sm font-bold uppercase text-gray-500">
              Mi gestión
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">

              <div className="rounded-lg border bg-green-50 p-3">

                <span className="text-xs text-gray-500">
                  Activas
                </span>

                <p className="mt-1 text-2xl font-bold text-[#0F3D1F]">
                  {ticketsSolicitanteActivos.length}
                </p>

              </div>

              <div className="rounded-lg border bg-blue-50 p-3">

                <span className="text-xs text-gray-500">
                  Respondidas
                </span>

                <p className="mt-1 text-2xl font-bold text-blue-700">
                  {ticketsSolicitanteCompletados.length}
                </p>

              </div>

            </div>

            <div className="mt-4 rounded-lg border p-3">

              <span className="text-xs text-gray-500">
                Tiempo promedio de respuesta
              </span>

              <p className="mt-2 text-2xl font-bold text-gray-800">
                {promedioRespuestaSolicitante}
                {" "}
                días
              </p>

            </div>

          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">

            <h2 className="text-sm font-bold uppercase text-gray-500">
              Mis solicitudes por tipo
            </h2>

            <div className="mt-4 flex flex-col gap-3">

              {tiposSolicitud.slice(0, 5).map(
                (item) => (

                  <div key={item.tipo}>

                    <div className="mb-1 flex justify-between gap-3 text-sm">

                      <span className="font-medium text-gray-700">
                        {item.tipo}
                      </span>

                      <span className="font-bold text-gray-800">
                        {item.total}
                      </span>

                    </div>

                    <div className="h-2 rounded-full bg-gray-100">

                      <div
                        className="h-2 rounded-full bg-[#0F7A3B]"
                        style={{
                          width: `${Math.max(
                            8,
                            (
                              item.total /
                              mayorTipo
                            ) *
                              100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>
                )
              )}

              {tiposSolicitud.length === 0 && (

                <p className="text-sm text-gray-500">
                  Aún no tienes solicitudes registradas.
                </p>
              )}

            </div>

          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">

            <h2 className="text-sm font-bold uppercase text-gray-500">
              Últimas respuestas
            </h2>

            <div className="mt-4 flex flex-col gap-3">

              {ultimasRespuestasSolicitante.map(
                (ticket: any) => (

                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="rounded-lg border px-3 py-2 transition hover:bg-green-50"
                  >

                    <div className="flex items-center justify-between gap-3">

                      <span className="font-bold text-blue-700">
                        #{ticket.id}
                      </span>

                      <span className="text-xs font-semibold text-green-700">
                        Completado
                      </span>

                    </div>

                    <p className="mt-1 truncate text-sm text-gray-700">
                      {ticket.tipo}
                    </p>

                  </Link>
                )
              )}

              {ultimasRespuestasSolicitante.length === 0 && (

                <p className="text-sm text-gray-500">
                  Todavía no tienes respuestas recientes.
                </p>
              )}

            </div>

          </div>

        </div>
      )}

      {role !== "SOLICITANTE" && (

      <div className="mb-8 grid grid-cols-1 xl:grid-cols-3 gap-4">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">

          <h2 className="text-sm font-bold uppercase text-gray-500">
            Atención prioritaria
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">

            <div className="rounded-lg border bg-gray-50 p-3">

              <span className="text-xs text-gray-500">
                Abiertos
              </span>

              <p className="mt-1 text-2xl font-bold text-[#0F3D1F]">
                {ticketsAbiertos.length}
              </p>

            </div>

            <div className="rounded-lg border bg-amber-50 p-3">

              <span className="text-xs text-gray-500">
                Más de 48h
              </span>

              <p className="mt-1 text-2xl font-bold text-amber-700">
                {ticketsSinGestionMayor48h.length}
              </p>

            </div>

          </div>

          <div className="mt-4 rounded-lg border p-3">

            <span className="text-xs text-gray-500">
              Ticket abierto más antiguo
            </span>

            {ticketMasAntiguo ? (

              <div className="mt-2 flex items-center justify-between gap-3">

                <Link
                  href={`/tickets/${ticketMasAntiguo.id}`}
                  className="font-bold text-blue-700 hover:underline"
                >
                  #{ticketMasAntiguo.id}
                </Link>

                <span className="text-sm font-semibold text-gray-700">
                  {diasTicketMasAntiguo}
                  {" "}
                  días
                </span>

              </div>
            ) : (

              <p className="mt-2 text-sm text-gray-500">
                Sin tickets abiertos
              </p>
            )}

          </div>

        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">

          <h2 className="text-sm font-bold uppercase text-gray-500">
            Solicitudes por tipo
          </h2>

          <div className="mt-4 flex flex-col gap-3">

            {tiposSolicitud.slice(0, 5).map(
              (item) => (

                <div key={item.tipo}>

                  <div className="mb-1 flex justify-between gap-3 text-sm">

                    <span className="font-medium text-gray-700">
                      {item.tipo}
                    </span>

                    <span className="font-bold text-gray-800">
                      {item.total}
                    </span>

                  </div>

                  <div className="h-2 rounded-full bg-gray-100">

                    <div
                      className="h-2 rounded-full bg-[#0F7A3B]"
                      style={{
                        width: `${Math.max(
                          8,
                          (
                            item.total /
                            mayorTipo
                          ) *
                            100
                        )}%`,
                      }}
                    />

                  </div>

                </div>
              )
            )}

          </div>

        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">

          <h2 className="text-sm font-bold uppercase text-gray-500">
            Fincas con más solicitudes
          </h2>

          <div className="mt-4 flex flex-col gap-3">

            {fincasTop.map(
              (item, index) => (

                <div
                  key={item.finca}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >

                  <div className="min-w-0">

                    <span className="text-xs font-semibold text-gray-400">
                      #{index + 1}
                    </span>

                    <p className="truncate font-medium text-gray-800">
                      {item.finca}
                    </p>

                  </div>

                  <strong className="rounded-md bg-gray-100 px-2 py-1 text-sm">
                    {item.total}
                  </strong>

                </div>
              )
            )}

          </div>

        </div>

      </div>

      )}

      {/* ULTIMOS TICKETS */}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

          <div>

            <h2 className="text-xl font-bold">

              {estadoSeleccionado
                ? `Tickets ${estadoSeleccionado.toLowerCase()}`
                : "Últimos Tickets"}

            </h2>

            <p className="text-sm text-gray-500">

              Mostrando
              {" "}
              <strong>
                {ticketsFiltrados.length}
              </strong>
              {" "}
              registros

            </p>

          </div>

          {estadoSeleccionado && (

            <Link
              href={
                role === "ADMIN" &&
                mesIndicadores
                  ? `/dashboard?mes=${encodeURIComponent(
                      mesIndicadores
                    )}`
                  : "/dashboard"
              }
              className="rounded-md border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >

              Quitar filtro

            </Link>
          )}

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="border-b">

                <th className="text-left p-3">
                  ID
                </th>

                <th className="text-left p-3">
                  Tipo
                </th>

                <th className="text-left p-3">
                  Solicitante
                </th>

                <th className="text-left p-3">
                  Finca
                </th>

                <th className="text-left p-3">
                  Estado
                </th>

                <th className="text-left p-3">
                  Fecha
                </th>

              </tr>

            </thead>

            <tbody>

              {ticketsFiltrados
                .slice(0, 10)
                .map((ticket: any) => (

                <tr
  key={ticket.id}
  className="
    border-b
    hover:bg-green-50
    transition
  "
>

                  <td className="p-3">

  <Link

    href={`/tickets/${ticket.id}`}

    className="
      font-bold
      text-blue-700
      hover:underline
    "
  >

    #{ticket.id}

  </Link>

</td>

                  <td className="p-3">
                    {ticket.tipo}
                  </td>

                  <td className="p-3">
                    {ticket.solicitante}
                  </td>

                  <td className="p-3">
                    {obtenerFincaTicket(
                      ticket
                    )}
                  </td>

                  <td className="p-3">
                    {ticket.estado}
                  </td>

                  <td className="p-3">

                    {formatearFechaColombia(
                      ticket.fechaCreacion
                    )}

                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}
