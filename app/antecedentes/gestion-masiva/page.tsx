import { redirect }
from "next/navigation";

import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

import {
  puedeVerAntecedenteCompleto,
} from "@/lib/antecedentesCatalogos";

import GestionMasivaAntecedentes
from "@/components/GestionMasivaAntecedentes";

import { autocompletarAntecedentes }
from "@/lib/autocompletarAntecedentes";

import { ocultarSolicitudesHistoricas }
from "@/lib/solicitudesHistoricas";

function obtenerFincaTicket(
  ticket: any
) {
  return (
    ticket.antecedente?.fincaEAI ||
    "Sin finca"
  );
}

export default async function GestionMasivaAntecedentesPage() {
  const session =
    await getServerSession(
      authOptions
    );

  if (
    !puedeVerAntecedenteCompleto(
      session?.user?.role
    )
  ) {
    redirect("/dashboard");
  }

  const solicitudes =
    ocultarSolicitudesHistoricas(
      await prisma.solicitud.findMany({
        where: {
          tipo:
            "ANTECEDENTES",
          estado: {
            in: [
              "Pendiente",
              "EN PROCESO",
              "REABIERTO",
            ],
          },
        },
        include: {
          antecedente: true,
          antecedentesRegistros: {
            orderBy: {
              id: "asc",
            },
          },
        },
        orderBy: {
          fechaCreacion:
            "desc",
        },
      })
    );

  const registrosBase =
    solicitudes.flatMap(
      (solicitud: any) =>
        solicitud
          .antecedentesRegistros
          .map((registro: any) => ({
            id:
              registro.id,
            fechaSolicitud:
              registro.fechaSolicitud,
            fechaRespuesta:
              registro.fechaRespuesta,
            eai:
              registro.eai,
            nombresApellidos:
              registro.nombresApellidos,
            tipoDocumento:
              registro.tipoDocumento,
            identificacion:
              registro.identificacion,
            fechaExpedicionDocumento:
              registro
                .fechaExpedicionDocumento,
            observacion:
              registro.observacion,
            revisadoPor:
              registro.revisadoPor,
            motivo:
              registro.motivo,
            autorizacion:
              registro.autorizacion,
            observaciones:
              registro.observaciones,
            tusdatosBatchId:
              registro.tusdatosBatchId,
            tusdatosJobId:
              registro.tusdatosJobId,
            tusdatosBatchNumber:
              registro.tusdatosBatchNumber,
            tusdatosEstado:
              registro.tusdatosEstado,
            tusdatosEnviadoAt:
              registro.tusdatosEnviadoAt
                ? registro.tusdatosEnviadoAt.toISOString()
                : null,
            solicitudId:
              solicitud.id,
            ticketEstado:
              solicitud.estado,
            finca:
              obtenerFincaTicket(
                solicitud
              ),
            solicitante:
              solicitud.solicitante,
          }))
    );

  const registrosAutocompletados =
    await autocompletarAntecedentes(
      registrosBase
    );

  const registros =
    registrosBase.map(
      (registro: any, index) => ({
        ...registro,
        ...registrosAutocompletados[
          index
        ],
        solicitudId:
          registro.solicitudId,
        ticketEstado:
          registro.ticketEstado,
        finca:
          registro.finca,
        solicitante:
          registro.solicitante,
      })
    );

  const tickets =
    solicitudes.map(
      (solicitud: any) => ({
        id:
          solicitud.id,
        finca:
          obtenerFincaTicket(
            solicitud
          ),
        solicitante:
          solicitud.solicitante,
        estado:
          solicitud.estado,
        totalRegistros:
          solicitud
            .antecedentesRegistros
            .length,
      })
    );

  return (
    <div className="min-h-screen bg-[#E8EEF2] p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F3D1F]">
          Gestion masiva de antecedentes
        </h1>

        <p className="mt-2 text-gray-600">
          Consolide varios tickets en una sola tabla y guarde la gestion en cada ticket original.
        </p>
      </div>

      <GestionMasivaAntecedentes
        tickets={tickets}
        registros={registros}
        role={session?.user?.role || ""}
      />
    </div>
  );
}
