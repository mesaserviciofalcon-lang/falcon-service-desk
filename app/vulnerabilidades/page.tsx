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

import {
  puedeGestionarVulnerabilidadesAsignadas,
  puedeVerVulnerabilidades,
} from "@/lib/permisosUsuarios";

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
    cerradosPagina?: string;
  }>;
}) {
  const session =
    await getServerSession(
      authOptions
    );

  const role =
    session?.user?.role || "";
  const cargo =
    session?.user?.cargo || "";
  const fincaEAI =
    String(session?.user?.fincaEAI || "")
      .trim()
      .toUpperCase();

  if (!puedeVerVulnerabilidades(role, cargo)) {
    redirect("/dashboard");
  }

  const puedeCrear =
    rolesCreacion.includes(role);
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
  const cerradosPagina =
    Math.max(
      1,
      Number(
        params.cerradosPagina ||
          "1"
      ) || 1
    );
  const cerradosSkip =
    (cerradosPagina - 1) *
    POR_PAGINA;

  const selectResumen = {
    id: true,
    consecutivo: true,
    eai: true,
    fecha: true,
    actoInseguro: true,
    estado: true,
    supervisor: true,
    reportadoPor: true,
  } as const;

  function serializarInformes(
    informes: Array<{
      id: number;
      consecutivo: string | null;
      eai: string;
      fecha: Date;
      actoInseguro: string;
      estado: string;
      supervisor: string;
      reportadoPor: string | null;
    }>
  ) {
    return informes.map((informe) => ({
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
  }

  if (
    puedeGestionarVulnerabilidadesAsignadas(
      role,
      cargo
    )
  ) {
    const filtroEai = fincaEAI
      ? {
          eai: {
            equals: fincaEAI,
            mode: "insensitive" as const,
          },
        }
      : {
          id: -1,
        };
    const wherePendientes = {
      ...filtroEai,
      estado:
        "ABIERTO",
    };
    const whereCerrados = {
      ...filtroEai,
      estado:
        "CERRADO",
    };

    const [
      totalPendientes,
      pendientes,
      totalCerrados,
      cerrados,
    ] = await Promise.all([
      prisma
        .vulnerabilidadInforme
        .count({
          where:
            wherePendientes,
        }),
      prisma
        .vulnerabilidadInforme
        .findMany({
          where:
            wherePendientes,
          select:
            selectResumen,
          orderBy: {
            fecha: "desc",
          },
          skip,
          take:
            POR_PAGINA,
        }),
      prisma
        .vulnerabilidadInforme
        .count({
          where:
            whereCerrados,
        }),
      prisma
        .vulnerabilidadInforme
        .findMany({
          where:
            whereCerrados,
          select:
            selectResumen,
          orderBy: [
            {
              fechaCierre:
                "desc",
            },
            {
              fecha:
                "desc",
            },
          ],
          skip:
            cerradosSkip,
          take:
            POR_PAGINA,
        }),
    ]);

    const totalPaginasPendientes =
      Math.max(
        1,
        Math.ceil(
          totalPendientes /
            POR_PAGINA
        )
      );
    const totalPaginasCerrados =
      Math.max(
        1,
        Math.ceil(
          totalCerrados /
            POR_PAGINA
        )
      );

    return (
      <div className="min-h-screen bg-[#E8EEF2] p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#0F3D1F]">
            Analisis de vulnerabilidades
          </h1>
          <p className="mt-2 text-gray-600">
            Consulte los análisis históricos y pendientes de su EAI. Solo puede gestionar los que estén asignados a su correo.
          </p>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#0F3D1F]">
            Analisis pendientes de mi EAI
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Abra un análisis para consultar su detalle. El cierre se habilita únicamente al analista asignado.
          </p>
        </div>

        <ListadoVulnerabilidades
          informes={
            serializarInformes(
              pendientes
            )
          }
          pagina={pagina}
          totalPaginas={
            totalPaginasPendientes
          }
        />

        <div className="mb-4 mt-8">
          <h2 className="text-xl font-bold text-[#0F3D1F]">
            Analisis cerrados
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Vista compacta para consulta y soporte en auditorias.
          </p>
        </div>

        <ListadoVulnerabilidades
          informes={
            serializarInformes(
              cerrados
            )
          }
          pagina={
            cerradosPagina
          }
          totalPaginas={
            totalPaginasCerrados
          }
          parametroPagina="cerradosPagina"
        />
      </div>
    );
  }

  const where = {
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
        select:
          selectResumen,
        orderBy: {
          fecha: "desc",
        },
        skip,
        take:
          POR_PAGINA,
      }),
  ]);

  const informesSerializados =
    serializarInformes(
      informes
    );
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
        puedeAgregarObservacion={
          puedeCrear
        }
        puedeEliminar={
          role === "ADMIN"
        }
      />
    </div>
  );
}
