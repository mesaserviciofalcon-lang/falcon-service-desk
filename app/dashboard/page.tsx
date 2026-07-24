import { prisma }
from "@/lib/prisma";

import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import Link
from "next/link";

import { formatearFechaColombia }
from "@/lib/fecha";

import { solicitantePuedeVerSolicitud }
from "@/lib/visibilidadSolicitudes";

import { ocultarSolicitudesHistoricas }
from "@/lib/solicitudesHistoricas";

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

        antecedentesRegistros: true,

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

const hace3Dias =
  new Date();

hace3Dias.setDate(
  hace3Dias.getDate() - 3
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
            ) >= hace3Dias
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
            ) >= hace3Dias
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
            ) >= hace3Dias
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
            ) >= hace3Dias
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

  const rolesVistaEjecutivaCompleta =
    role === "ADMIN"

    ||

    role === "DIRECTOR_SEG"

    ||

    role === "JEFE_SEG";

  const ticketsMetricas =
    rolesVistaEjecutivaCompleta
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
    role === "ADMIN" &&
    mesSeleccionado;

  const ticketsMetricasFiltradas =
    aplicarFiltroMes
      ? ticketsMetricas.filter(
          (ticket: any) =>
            obtenerMesTicket(
              ticket.fechaCreacion
            ) ===
            mesSeleccionado
        )
      : ticketsMetricas;

  const mesesDisponibles =
    Array.from(
      new Set(
        solicitudes.map(
          (ticket: any) =>
            obtenerMesTicket(
              ticket.fechaCreacion
            )
        )
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
            mesSeleccionado
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

  const registrosAntecedentesMetricas =
    ticketsMetricasFiltradas.flatMap(
      (ticket: any) =>
        ticket.antecedentesRegistros ||
        []
    );

  const continuarProceso =
    registrosAntecedentesMetricas.filter(
      (registro: any) =>
        registro.observacion ===
        "CONTINUAR CON EL PROCESO"
    ).length;

  const noPuedeContinuar =
    registrosAntecedentesMetricas.filter(
      (registro: any) =>
        registro.observacion ===
        "LA PERSONA NO DEBE SER TENIDA EN CUENTA"
    ).length;

  const documentoNoCorresponde =
    registrosAntecedentesMetricas.filter(
      (registro: any) =>
        registro.observacion ===
        "EL NUMERO DE DOCUMENTO NO CORRESPONDE CON EL NOMBRE"
    ).length;

  const nacionales =
    registrosAntecedentesMetricas.filter(
      (registro: any) =>
        registro.tipoDocumento ===
        "CC"
    ).length;

  const extranjeros =
    registrosAntecedentesMetricas.filter(
      (registro: any) =>
        [
          "PP",
          "PPT",
          "CE",
        ].includes(
          registro.tipoDocumento || ""
        )
    ).length;

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

    <div className="p-8 bg-[#F4F6F8] min-h-screen">

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
          className="mb-6 flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm"
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
              Ver general
            </Link>
          )}

          <span className="text-sm text-gray-500">
            {mesSeleccionado
              ? `Mostrando ${formatearMes(
                  mesSeleccionado
                )}`
              : "Mostrando acumulado general"}
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
              mesSeleccionado
                ? `mes=${encodeURIComponent(
                    mesSeleccionado
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
                    {tarjeta.total}
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

          <div className="rounded-xl bg-white p-5 shadow-sm">

            <h2 className="text-sm font-bold uppercase text-gray-500">
              Conceptos de antecedentes
            </h2>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">

              <div className="rounded-lg border bg-green-50 p-4">

                <span className="text-xs font-semibold uppercase text-gray-500">
                  Continuar el proceso
                </span>

                <p className="mt-2 text-3xl font-bold text-green-700">
                  {continuarProceso}
                </p>

              </div>

              <div className="rounded-lg border bg-yellow-100 p-4">

                <span className="text-xs font-semibold uppercase text-gray-500">
                  No puede continuar
                </span>

                <p className="mt-2 text-3xl font-bold text-red-700">
                  {noPuedeContinuar}
                </p>

              </div>

              <div className="rounded-lg border bg-emerald-50 p-4">

                <span className="text-xs font-semibold uppercase text-gray-500">
                  Documento no corresponde
                </span>

                <p className="mt-2 text-3xl font-bold text-emerald-800">
                  {documentoNoCorresponde}
                </p>

              </div>

            </div>

          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">

            <h2 className="text-sm font-bold uppercase text-gray-500">
              Nacionales y extranjeros
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">

              <div className="rounded-lg border bg-blue-50 p-4">

                <span className="text-xs font-semibold uppercase text-gray-500">
                  Nacionales CC
                </span>

                <p className="mt-2 text-3xl font-bold text-blue-700">
                  {nacionales}
                </p>

              </div>

              <div className="rounded-lg border bg-slate-50 p-4">

                <span className="text-xs font-semibold uppercase text-gray-500">
                  Extranjeros PP, PPT y CE
                </span>

                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {extranjeros}
                </p>

              </div>

            </div>

            <p className="mt-3 text-xs text-gray-500">
              Total registros evaluados:
              {" "}
              <strong>
                {registrosAntecedentesMetricas.length}
              </strong>
            </p>

          </div>

        </div>
      )}

      {role === "SOLICITANTE" && (

        <div className="mb-8 grid grid-cols-1 xl:grid-cols-3 gap-4">

          <div className="rounded-xl bg-white p-5 shadow-sm">

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

          <div className="rounded-xl bg-white p-5 shadow-sm">

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

          <div className="rounded-xl bg-white p-5 shadow-sm">

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

        <div className="rounded-xl bg-white p-5 shadow-sm">

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

        <div className="rounded-xl bg-white p-5 shadow-sm">

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

        <div className="rounded-xl bg-white p-5 shadow-sm">

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

      <div className="bg-white rounded-xl shadow-md p-5">

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
                mesSeleccionado
                  ? `/dashboard?mes=${encodeURIComponent(
                      mesSeleccionado
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
