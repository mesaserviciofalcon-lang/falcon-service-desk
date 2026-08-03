import { redirect }
from "next/navigation";

import { getServerSession }
from "next-auth";

import FormularioVulnerabilidad
from "@/components/FormularioVulnerabilidad";

import ListadoVulnerabilidades
from "@/components/ListadoVulnerabilidades";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

const rolesPermitidos = [
  "ADMIN",
  "DIRECTOR_SEG",
  "JEFE_SEG",
  "SUPERVISOR",
  "SOLICITANTE",
];

const rolesCreacion = [
  "ADMIN",
  "DIRECTOR_SEG",
  "JEFE_SEG",
  "SUPERVISOR",
];

export default async function VulnerabilidadesPage() {
  const session =
    await getServerSession(
      authOptions
    );

  if (
    !rolesPermitidos.includes(
      session?.user?.role || ""
    )
  ) {
    redirect("/dashboard");
  }

  const puedeCrear =
    rolesCreacion.includes(
      session?.user?.role || ""
    );
  const puedeCerrarAnalisis =
    session?.user?.role ===
    "SOLICITANTE";

  const informes =
    await prisma
      .vulnerabilidadInforme
      .findMany({
        where: puedeCrear
          ? {}
          : {
              analistaSigCorreo:
                session?.user?.email || "",
              estado:
                "ABIERTO",
            },
        orderBy: {
          fecha: "desc",
        },
        take: 50,
      });

  const informesSerializados =
    informes.map((informe) => ({
      id: informe.id,
      consecutivo:
        informe.consecutivo,
      eai: informe.eai,
      fecha:
        informe.fecha.toISOString(),
      actoInseguro:
        informe.actoInseguro,
      vulnerabilidad:
        informe.vulnerabilidad,
      planAccionSugerido:
        informe.planAccionSugerido,
      estado:
        informe.estado,
      supervisor:
        informe.supervisor,
      reportadoPor:
        informe.reportadoPor,
      cierreObservaciones:
        informe.cierreObservaciones,
      causaRaiz:
        informe.causaRaiz,
      proceso:
        informe.proceso,
      planAccionEai:
        informe.planAccionEai,
      responsables:
        informe.responsables,
      fechaEjecucion:
        informe.fechaEjecucion,
    }));

  return (
    <div className="min-h-screen bg-[#E8EEF2] p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F3D1F]">
          Analisis de vulnerabilidades
        </h1>
        <p className="mt-2 text-gray-600">
          Registre la novedad, adjunte fotos y envie el informe PDF a la finca correspondiente.
        </p>
      </div>

      {puedeCrear && (
        <div className="mb-8">
          <FormularioVulnerabilidad />
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#0F3D1F]">
          {puedeCrear
            ? "Seguimiento de analisis"
            : "Mis analisis pendientes"}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {puedeCrear
            ? "Consulte el estado de los informes generados."
            : "Cierre los analisis asignados y adjunte la evidencia correspondiente."}
        </p>
      </div>

      <ListadoVulnerabilidades
        informes={
          informesSerializados
        }
        puedeCerrar={
          puedeCerrarAnalisis
        }
      />
    </div>
  );
}
