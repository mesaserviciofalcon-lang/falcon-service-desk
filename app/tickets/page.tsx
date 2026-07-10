import ReabrirTicket
from "@/components/ReabrirTicket";

import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import GestionTicket
from "@/components/GestionTicket";

import TicketCard
from "@/components/TicketCard";

import FiltrosTickets
from "@/components/FiltrosTickets";

async function obtenerSolicitudes() {

  const response = await fetch(
    `${process.env.NEXTAUTH_URL}/api/solicitudes`,
    {
      cache: "no-store",
    }
  );

  return response.json();
}

export default async function TicketsPage() {

  const session =
    await getServerSession(
      authOptions
    );

  const role =
    session?.user?.role;

const email =
  session?.user?.email;

  const todasSolicitudes =
    await obtenerSolicitudes();

  let solicitudes =
    todasSolicitudes;
    const hace8Dias =
  new Date();

hace8Dias.setDate(
  hace8Dias.getDate() - 8
);

  // TECNICO

  if (
    role === "TECNICO"

    ||

    role === "JEFE_SEG"

    ||

    role === "DIRECTOR_SEG"
  ) {

  solicitudes =
    todasSolicitudes.filter(
      (solicitud: any) => {

        const esSeguridad =

          role === "JEFE_SEG"

          ||

          role === "DIRECTOR_SEG";

        return (

          (
            solicitud.tipo ===
              "CCTV"

            ||

            solicitud.tipo ===
              "RADIOS"

            ||

            (

              esSeguridad

              &&

              solicitud.tipo ===
                "NOVEDAD SEGURIDAD"
            )
          )

          &&

          solicitud.estado !==
            "COMPLETADO"
        );
      }
    );
}

if (role === "SOLICITANTE") {

  solicitudes =
    todasSolicitudes.filter(
      (solicitud: any) => {

        const visible =

          solicitud.estado !==
            "COMPLETADO"

          ||

          (
            solicitud.fechaCierre &&

            new Date(
              solicitud.fechaCierre
            ) >= hace8Dias
          );

        return (

          solicitud
            .correoSolicitante ===
          email

          &&

          visible
        );
      }
    );
}

  // VISITA

  if (role === "VISITA") {

  solicitudes =
    todasSolicitudes.filter(
      (solicitud: any) => {

        return (

          solicitud.tipo ===
            "VISITA DOMICILIARIA"

          &&

          solicitud.estado !==
            "COMPLETADO"
        );
      }
    );
}

if (role === "SUPERVISOR") {

  solicitudes =
    todasSolicitudes.filter(
      (solicitud: any) => {

        return (

          solicitud.asignadoA ===
            "SEGURIDAD"

          &&

          solicitud.tipo ===
            "ANTECEDENTES"

          &&

          solicitud.estado !==
            "COMPLETADO"
        );
      }
    );
}

  return (

    <div>

      <h1 className="text-3xl font-bold mb-6">
        Tickets
      </h1>
{/* EXPORTAR VISITAS */}

{role === "VISITA" && (

  <a

    href="/api/exportar-visitas"

    className="bg-green-600 text-white px-4 py-2 rounded-lg inline-block mb-6"
  >

    Exportar Excel

  </a>
)}

{/* EXPORTAR REPORTES ADMIN */}

{role === "ADMIN" && (

  <div className="flex gap-4 mb-6 flex-wrap">

    <a

      href="/api/exportar-reportes?tipo=CCTV"

      className="bg-blue-600 text-white px-4 py-2 rounded-lg"
    >

      Exportar CCTV

    </a>

    <a

      href="/api/exportar-reportes?tipo=RADIOS"

      className="bg-blue-600 text-white px-4 py-2 rounded-lg"
    >

      Exportar Radios

    </a>

    <a

      href='/api/exportar-reportes?tipo=VISITA%20DOMICILIARIA'

      className="bg-blue-600 text-white px-4 py-2 rounded-lg"
    >

      Exportar Visitas

    </a>

    <a

      href="/api/exportar-reportes?tipo=ANTECEDENTES"

      className="bg-blue-600 text-white px-4 py-2 rounded-lg"
    >

      Exportar Antecedentes

    </a>

    <a

      href='/api/exportar-reportes?tipo=NOVEDAD%20SEGURIDAD'

      className="bg-blue-600 text-white px-4 py-2 rounded-lg"
    >

      Exportar Novedades

    </a>

  </div>
)}
      <FiltrosTickets

  solicitudes={solicitudes}

  role={role}

  session={session}

/>

    </div>
  );
}
