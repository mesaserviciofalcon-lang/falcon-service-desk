import { prisma }
from "@/lib/prisma";

import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import TicketCard
from "@/components/TicketCard";

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

        novedad: true,

        archivos: true,

        gestiones: {

          orderBy: {
            fecha: "desc",
          },
        },
      },
    });

  if (!solicitud) {

    return (

      <div className="p-8">

        Ticket no encontrado

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