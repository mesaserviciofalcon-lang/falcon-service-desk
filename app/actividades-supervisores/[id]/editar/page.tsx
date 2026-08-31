import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import EditarActividadSupervisor from "@/components/EditarActividadSupervisor";
import { authOptions } from "@/lib/auth";
import { puedeAdministrarActividades } from "@/lib/actividadesSupervisores";
import { prisma } from "@/lib/prisma";

export default async function EditarActividadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!puedeAdministrarActividades(session?.user?.role)) redirect("/dashboard");
  const { id } = await params;
  const [actividad, supervisores] = await Promise.all([
    prisma.actividadSupervisor.findUnique({ where: { id: Number(id) }, select: { id: true, fechaPlaneada: true, finca: true, actividad: true, area: true, supervisorCorreo: true } }),
    prisma.usuario.findMany({ where: { activo: true, rol: "SUPERVISOR" }, orderBy: { nombre: "asc" }, select: { nombre: true, email: true } }),
  ]);
  if (!actividad) notFound();
  return <EditarActividadSupervisor actividad={{ ...actividad, fechaPlaneada: actividad.fechaPlaneada.toISOString() }} supervisores={supervisores} />;
}
