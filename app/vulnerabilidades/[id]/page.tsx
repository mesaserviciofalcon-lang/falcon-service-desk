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

import {
  puedeGestionarVulnerabilidadesAsignadas,
  puedeVerVulnerabilidades,
} from "@/lib/permisosUsuarios";

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
  const cargo =
    session?.user?.cargo || "";

  if (!puedeVerVulnerabilidades(role, cargo)) {
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
        include: {
          observacionesSeguimiento: {
            orderBy: {
              createdAt:
                "desc",
            },
          },
        },
      });

  if (!informe) {
    notFound();
  }

  const puedeVer =
    rolesSeguridad.includes(role) ||
    (
      puedeGestionarVulnerabilidadesAsignadas(
        role,
        cargo
      ) &&
      informe.analistaSigCorreo === email
    );

  if (!puedeVer) {
    redirect("/dashboard");
  }

  const cierreEvidencias =
    Array.isArray(
      informe.cierreEvidencias
    )
      ? informe.cierreEvidencias
          .map((archivo: any) => ({
            url:
              typeof archivo?.url ===
              "string"
                ? archivo.url
                : "",
            nombre:
              typeof archivo?.nombre ===
              "string"
                ? archivo.nombre
                : "Evidencia",
            tipo:
              typeof archivo?.tipo ===
              "string"
                ? archivo.tipo
                : undefined,
          }))
          .filter(
            (archivo) =>
              archivo.url
          )
      : [];
  const fotos =
    Array.isArray(
      informe.fotos
    )
      ? informe.fotos
          .map((foto: any) => ({
            url:
              typeof foto?.url ===
              "string"
                ? foto.url
                : "",
            nombre:
              typeof foto?.nombre ===
              "string"
                ? foto.nombre
                : "Evidencia",
            tipo:
              typeof foto?.tipo ===
              "string"
                ? foto.tipo
                : undefined,
          }))
          .filter(
            (foto) =>
              foto.url
          )
      : [];

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
    fotos,
    cierreObservaciones:
      informe.cierreObservaciones,
    cierreEvidencias:
      cierreEvidencias,
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
    observacionesSeguimiento:
      informe
        .observacionesSeguimiento
        .map((observacion) => ({
          id:
            observacion.id,
          observacion:
            observacion.observacion,
          supervisor:
            observacion.supervisor,
          usuarioNombre:
            observacion.usuarioNombre,
          usuarioCorreo:
            observacion.usuarioCorreo,
          createdAt:
            observacion.createdAt.toISOString(),
        })),
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
          puedeGestionarVulnerabilidadesAsignadas(
            role,
            cargo
          )
        }
        puedeAgregarObservacion={
          rolesSeguridad.includes(
            role
          )
        }
      />
    </div>
  );
}
