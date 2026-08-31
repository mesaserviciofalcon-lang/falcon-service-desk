import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import DetalleActividadSupervisor from "@/components/DetalleActividadSupervisor";
import { authOptions } from "@/lib/auth";
import { normalizarCorreo, puedeAdministrarActividades } from "@/lib/actividadesSupervisores";
import { prisma } from "@/lib/prisma";

export default async function ActividadDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const actividad = await prisma.actividadSupervisor.findUnique({ where: { id: Number(id) } });
  if (!actividad) notFound();
  const esAdministrador = puedeAdministrarActividades(session?.user?.role);
  const esSupervisorAsignado = session?.user?.role === "SUPERVISOR" && normalizarCorreo(actividad.supervisorCorreo) === normalizarCorreo(session.user.email);
  if (!esAdministrador && !esSupervisorAsignado) redirect("/dashboard");
  const evidencias = Array.isArray(actividad.evidencias) ? actividad.evidencias.filter((archivo: any) => archivo?.url && archivo?.nombre) : [];
  return <DetalleActividadSupervisor actividad={{ ...actividad, fechaPlaneada: actividad.fechaPlaneada.toISOString(), evidencias: evidencias as any }} puedeCerrar={esSupervisorAsignado} />;
}
