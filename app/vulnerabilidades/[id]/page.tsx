import Link
from "next/link";

import { notFound, redirect }
from "next/navigation";

import { getServerSession }
from "next-auth";

import DetalleVulnerabilidad
from "@/components/DetalleVulnerabilidad";

import EliminarVulnerabilidadButton
from "@/components/EliminarVulnerabilidadButton";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

const rolesSeguridad = [
  "ADMIN",
  "DIRECTOR_SEG",
  "JEFE_SEG",
  "SUPERVISOR",
];

export default async function VulnerabilidadDetallePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const session =
    await getServerSession(
      authOptions
    );

  const role =
    session?.user?.role || "";
  const email =
    session?.user?.email || "";

  if (
    !rolesSeguridad.includes(role) &&
    role !== "SOLICITANTE"
  ) {
    redirect("/dashboard");
  }

  const {
    id,
  } = await params;

  const informe =
    await prisma
      .vulnerabilidadInforme
      .findUnique({
        where: {
          id:
            Number(id),
        },
      });

  if (!informe) {
    notFound();
  }

  const puedeVer =
    rolesSeguridad.includes(role) ||
    informe.analistaSigCorreo ===
      email;

  if (!puedeVer) {
    redirect("/dashboard");
  }

  const informeSerializado = {
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
  };

  return (
    <div className="min-h-screen bg-[#E8EEF2] p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#0F3D1F]">
            Detalle del analisis
          </h1>
          <p className="mt-2 text-gray-600">
            Consulte la informacion completa y gestione el cierre si corresponde.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {role === "ADMIN" && (
            <EliminarVulnerabilidadButton
              id={
                informe.id
              }
              redirectTo="/vulnerabilidades"
            />
          )}

          <Link
            href="/vulnerabilidades"
            className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
          >
            Volver
          </Link>
        </div>
      </div>

      <DetalleVulnerabilidad
        informe={
          informeSerializado
        }
        puedeCerrar={
          role === "SOLICITANTE"
        }
      />
    </div>
  );
}
