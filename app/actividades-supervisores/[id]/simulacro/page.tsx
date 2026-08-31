import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import FormularioSimulacro from "@/components/FormularioSimulacro";
import { authOptions } from "@/lib/auth";
import { normalizarCorreo } from "@/lib/actividadesSupervisores";
import { definicionSimulacro, esActividadSimulacro } from "@/lib/simulacros";
import { prisma } from "@/lib/prisma";

export default async function SimulacroActividadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const actividad = await prisma.actividadSupervisor.findUnique({ where: { id: Number(id) }, include: { simulacro: true } });
  if (!actividad || !esActividadSimulacro(actividad.actividad)) notFound();
  const esSupervisorAsignado = session?.user?.role === "SUPERVISOR" && normalizarCorreo(actividad.supervisorCorreo) === normalizarCorreo(session.user.email);
  if (!esSupervisorAsignado) redirect("/dashboard");
  if (actividad.simulacro) redirect(`/actividades-supervisores/${actividad.id}/simulacro/pdf`);
  const definicion = definicionSimulacro(actividad.actividad, actividad.area, actividad.finca);
  if (!definicion) notFound();
  return <FormularioSimulacro actividad={actividad} definicion={definicion} />;
}
