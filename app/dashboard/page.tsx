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

export default async function DashboardPage() {

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

  // CONTADORES

  const pendientes =
    tickets.filter(
      (s: any) =>

        s.estado ===
        "Pendiente"
    ).length;

  const enProceso =
    tickets.filter(
      (s: any) =>

        s.estado ===
        "EN PROCESO"
    ).length;

  const reabiertos =
    tickets.filter(
      (s: any) =>

        s.estado ===
        "REABIERTO"
    ).length;

  const completados =
    tickets.filter(
      (s: any) =>

        s.estado ===
        "COMPLETADO"
    ).length;

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

      {/* KPI */}

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

  {/* PENDIENTES */}

  <div className="bg-white rounded-2xl shadow-lg p-6 border-l-8 border-yellow-500">

    <h2 className="text-gray-500 text-sm">

      PENDIENTES

    </h2>

    <p className="text-5xl font-bold mt-4 text-yellow-600">

      {pendientes}

    </p>

  </div>

  {/* EN PROCESO */}

  <div className="bg-white rounded-2xl shadow-lg p-6 border-l-8 border-blue-500">

    <h2 className="text-gray-500 text-sm">

      EN PROCESO

    </h2>

    <p className="text-5xl font-bold mt-4 text-blue-600">

      {enProceso}

    </p>

  </div>

  {/* REABIERTOS */}

  <div className="bg-white rounded-2xl shadow-lg p-6 border-l-8 border-red-500">

    <h2 className="text-gray-500 text-sm">

      REABIERTOS

    </h2>

    <p className="text-5xl font-bold mt-4 text-red-600">

      {reabiertos}

    </p>

  </div>

  {/* COMPLETADOS */}

  <div className="bg-white rounded-2xl shadow-lg p-6 border-l-8 border-[#2FAE4A]">

    <h2 className="text-gray-500 text-sm">

      COMPLETADOS

    </h2>

    <p className="text-5xl font-bold mt-4 text-[#2FAE4A]">

      {completados}

    </p>

  </div>

</div>

      {/* ULTIMOS TICKETS */}

      <div className="bg-white rounded-2xl shadow-lg p-6">

        <h2 className="text-2xl font-bold mb-6">

          Últimos Tickets

        </h2>

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

              {tickets
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
