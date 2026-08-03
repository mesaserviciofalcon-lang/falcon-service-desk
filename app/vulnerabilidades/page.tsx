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

const POR_PAGINA = 8;

function rangoCerradosVisibles() {
  const ahora =
    new Date();
  const year =
    ahora.getFullYear();
  const month =
    ahora.getMonth();
  const day =
    ahora.getDate();
  const mesInicio =
    day <= 8
      ? month - 1
      : month;

  return new Date(
    year,
    mesInicio,
    1
  );
}

export default async function VulnerabilidadesPage({
  searchParams,
}: {
  searchParams: Promise<{
    pagina?: string;
  }>;
}) {
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
  const params =
    await searchParams;
  const pagina =
    Math.max(
      1,
      Number(params.pagina || "1") ||
        1
    );
  const skip =
    (pagina - 1) * POR_PAGINA;
  const where = puedeCrear
    ? {
        OR: [
          {
            estado: {
              not:
                "CERRADO",
            },
          },
          {
            estado:
              "CERRADO",
            fecha: {
              gte:
                rangoCerradosVisibles(),
            },
          },
        ],
      }
    : {
        analistaSigCorreo:
          session?.user?.email || "",
        estado:
          "ABIERTO",
      };

  const [
    totalInformes,
    informes,
  ] = await Promise.all([
    prisma
      .vulnerabilidadInforme
      .count({
        where,
      }),
    prisma
      .vulnerabilidadInforme
      .findMany({
        where,
        select: {
          id: true,
          consecutivo: true,
          eai: true,
          fecha: true,
          actoInseguro: true,
          estado: true,
          supervisor: true,
          reportadoPor: true,
        },
        orderBy: {
          fecha: "desc",
        },
        skip,
        take:
          POR_PAGINA,
      }),
  ]);

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
      estado:
        informe.estado,
      supervisor:
        informe.supervisor,
      reportadoPor:
        informe.reportadoPor,
    }));
  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        totalInformes / POR_PAGINA
      )
    );

  return (
    <div className="min-h-screen bg-[#E8EEF2] p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F3D1F]">
          Analisis de vulnerabilidades
        </h1>
        <p className="mt-2 text-gray-600">
          Registre novedades y consulte el seguimiento resumido de los analisis.
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
        pagina={pagina}
        totalPaginas={totalPaginas}
        puedeEliminar={
          session?.user?.role ===
          "ADMIN"
        }
      />
    </div>
  );
}
