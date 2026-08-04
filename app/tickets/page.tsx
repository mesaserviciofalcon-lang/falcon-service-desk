import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import FiltrosTickets
from "@/components/FiltrosTickets";

import { prisma }
from "@/lib/prisma";

import { solicitantePuedeVerSolicitud }
from "@/lib/visibilidadSolicitudes";

import { ocultarSolicitudesHistoricas }
from "@/lib/solicitudesHistoricas";

import {
  visibleEnBandejaPorRol,
} from "@/lib/visibilidadTickets";

function obtenerWherePorRol(
  role?: string
) {
  if (role === "VISITA") {
    return {
      tipo: "VISITA DOMICILIARIA",
    };
  }

  if (role === "SUPERVISOR") {
    return {
      tipo: "ANTECEDENTES",
      asignadoA: "SEGURIDAD",
    };
  }

  if (role === "TECNICO") {
    return {
      tipo: {
        in: [
          "CCTV",
          "RADIOS",
        ],
      },
    };
  }

  if (
    role === "JEFE_SEG" ||
    role === "DIRECTOR_SEG"
  ) {
    return {
      tipo: {
        in: [
          "CCTV",
          "RADIOS",
          "NOVEDAD SEGURIDAD",
        ],
      },
    };
  }

  return {};
}

async function obtenerSolicitudes(
  role?: string
) {

  return prisma.solicitud.findMany({

    where: obtenerWherePorRol(
      role
    ),

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
  });
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

const fincaEAI =
  session?.user?.fincaEAI;

  const todasSolicitudes =
    ocultarSolicitudesHistoricas(
      await obtenerSolicitudes(
        role
      )
    );

  let solicitudes =
    todasSolicitudes.filter(
      (solicitud) =>
        visibleEnBandejaPorRol(
          solicitud,
          role
        )
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
    solicitudes.filter(
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

        );
      }
    );
}

if (role === "SOLICITANTE") {

  solicitudes =
    solicitudes.filter(
      (solicitud: any) => {

        return (

          solicitantePuedeVerSolicitud(
            solicitud,
            email,
            fincaEAI
          )

        );
      }
    );
}

  // VISITA

  if (role === "VISITA") {

  solicitudes =
    solicitudes.filter(
      (solicitud: any) => {

        return (

          solicitud.tipo ===
            "VISITA DOMICILIARIA"

        );
      }
    );
}

if (role === "SUPERVISOR") {

  solicitudes =
    solicitudes.filter(
      (solicitud: any) => {

        return (

          solicitud.asignadoA ===
            "SEGURIDAD"

          &&

          solicitud.tipo ===
            "ANTECEDENTES"

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
