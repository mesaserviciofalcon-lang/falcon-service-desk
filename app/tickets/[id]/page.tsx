import { prisma }
from "@/lib/prisma";

import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import TicketCard
from "@/components/TicketCard";

import { solicitantePuedeVerSolicitud }
from "@/lib/visibilidadSolicitudes";

import { esSolicitudHistorica }
from "@/lib/solicitudesHistoricas";

export default async function TicketDetalle({

  params,

}: {

  params: Promise<{
    id: string;
  }>;

}) {

  const resolvedParams =
    await params;

  const session =
    await getServerSession(
      authOptions
    );

  const solicitud =
    await prisma.solicitud.findUnique({

      where: {

        id: Number(
          resolvedParams.id
        ),
      },

      include: {

        cctv: true,

        visita: true,

        radio: true,

        antecedente: true,

        antecedentesRegistros: {

          orderBy: {
            id: "asc",
          },
        },

        novedad: true,

        archivos: true,

        gestiones: {

          orderBy: {
            fecha: "desc",
          },
        },
      },
    });

  if (
    !solicitud ||
    esSolicitudHistorica(solicitud)
  ) {

    return (

      <div className="p-8">

        Ticket no encontrado

      </div>
    );
  }

  if (
    session?.user?.role === "SOLICITANTE" &&
    !solicitantePuedeVerSolicitud(
      solicitud,
      session.user.email,
      session.user.fincaEAI
    )
  ) {

    return (

      <div className="p-8">

        No tiene permiso para ver este ticket

      </div>
    );
  }

  return (

    <div className="p-8 bg-[#F4F6F8] min-h-screen">

      <div className="mb-6">

        <a

          href="/tickets"

          className="
            text-blue-600
            underline
          "
        >

          ← Volver

        </a>

      </div>

      <TicketCard

        solicitud={solicitud}

        role={
          session?.user?.role
        }

        session={session}

      />

    </div>
  );
}
