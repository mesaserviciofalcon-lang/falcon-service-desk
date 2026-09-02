import { prisma }
from "@/lib/prisma";

import { getServerSession }
from "next-auth";

import Link
from "next/link";

import { authOptions }
from "@/lib/auth";

import TicketCard
from "@/components/TicketCard";

import { solicitantePuedeVerSolicitud }
from "@/lib/visibilidadSolicitudes";

import { esSolicitudHistorica }
from "@/lib/solicitudesHistoricas";

import {
  visibleEnBandejaPorRol,
} from "@/lib/visibilidadTickets";

import {
  obtenerUltimaVisitaHistorica,
} from "@/lib/visitasHistoricas";

import {
  tecnicoPuedeGestionarCctv,
} from "@/lib/cctvEjecucion";

import {
  puedeVerTodasLasFincasEnVisitas,
} from "@/lib/permisosConsultasSeguridad";

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

  if (
    session?.user?.role === "TECNICO" &&
    !(
      solicitud.tipo === "CCTV" &&
      tecnicoPuedeGestionarCctv({
        rol: session.user.role,
        correo: session.user.email,
        eai: solicitud.cctv?.fincaEAI,
        estado: solicitud.estado,
      })
    )
  ) {
    return (
      <div className="p-8">
        No tiene permiso para ver este ticket.
      </div>
    );
  }

  if (
    !visibleEnBandejaPorRol(
      solicitud,
      session?.user?.role
    )
  ) {

    return (

      <div className="p-8">

        Este ticket ya fue completado y no se encuentra disponible en su bandeja.

      </div>
    );
  }

  const ultimaVisitaHistorica =
    solicitud.tipo ===
      "VISITA DOMICILIARIA"
      ? await obtenerUltimaVisitaHistorica(
          solicitud.visita?.cedula,
          puedeVerTodasLasFincasEnVisitas(
            session?.user?.role
          )
            ? null
            : session?.user?.fincaEAI
        )
      : null;

  return (

    <div className="p-8 bg-[#E8EEF2] min-h-screen">

      <div className="mb-6">

        <Link

          href="/tickets"

          className="
            text-blue-600
            underline
          "
        >

          ← Volver

        </Link>

      </div>

      <TicketCard

        solicitud={{
          ...solicitud,
          ultimaVisitaHistorica,
        }}

        role={
          session?.user?.role
        }

        session={session}

      />

    </div>
  );
}
