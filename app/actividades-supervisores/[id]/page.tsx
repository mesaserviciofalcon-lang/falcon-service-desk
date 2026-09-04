import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import DetalleActividadSupervisor from "@/components/DetalleActividadSupervisor";
import { authOptions } from "@/lib/auth";
import { normalizarCorreo, puedeAdministrarActividades } from "@/lib/actividadesSupervisores";
import { analistaTieneAccesoAFinca } from "@/lib/fincasAnalistaSig";
import { esAnalistaSig } from "@/lib/permisosUsuarios";
import { prisma } from "@/lib/prisma";
import { esActividadSimulacro } from "@/lib/simulacros";

export default async function ActividadDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const actividad = await prisma.actividadSupervisor.findUnique({ where: { id: Number(id) } });
  if (!actividad) notFound();
  const esAdministrador = puedeAdministrarActividades(session?.user?.role);
  const esSupervisorAsignado = session?.user?.role === "SUPERVISOR" && normalizarCorreo(actividad.supervisorCorreo) === normalizarCorreo(session.user.email);
  const usuario = session?.user?.email ? await prisma.usuario.findUnique({ where: { email: session.user.email }, select: { nombre: true, cargo: true, fincaEAI: true } }) : null;
  const esAnalistaDeLaFinca = esAnalistaSig(usuario?.cargo) && analistaTieneAccesoAFinca(usuario, actividad.finca);
  if (!esAdministrador && !esSupervisorAsignado && !esAnalistaDeLaFinca) redirect("/dashboard");
  const evidencias = Array.isArray(actividad.evidencias) ? actividad.evidencias.filter((archivo: any) => archivo?.url && archivo?.nombre) : [];
  return <DetalleActividadSupervisor actividad={{ ...actividad, fechaPlaneada: actividad.fechaPlaneada.toISOString(), fechaCierre: actividad.fechaCierre?.toISOString() || null, evidencias: evidencias as any }} puedeCerrar={esAdministrador || esSupervisorAsignado} esSimulacro={esActividadSimulacro(actividad.actividad)} />;
}
