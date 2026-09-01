import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import FormularioSimulacro from "@/components/FormularioSimulacro";
import { authOptions } from "@/lib/auth";
import { normalizarCorreo } from "@/lib/actividadesSupervisores";
import { definicionSimulacro, esActividadSimulacro, mismaFincaSimulacro } from "@/lib/simulacros";
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
  const usuarios = await prisma.usuario.findMany({ where: { activo: true }, select: { nombre: true, cargo: true, rol: true, fincaEAI: true } });
  const analista = usuarios.find((usuario) => usuario.cargo === "ANALISTA SIG" && mismaFincaSimulacro(usuario.fincaEAI, actividad.finca));
  const personasFijas = usuarios.filter((usuario) => ["JEFE_SEG", "DIRECTOR_SEG"].includes(usuario.rol) || ["JEFE SEG", "DIRECTOR SEG"].includes(String(usuario.cargo || ""))).map((usuario) => `${usuario.nombre} - ${usuario.cargo || usuario.rol}`);
  const personasInformadas = [`${analista?.nombre || definicion.analista} - ANALISTA SIG`, ...personasFijas].join(" / ");
  return <FormularioSimulacro actividad={actividad} definicion={{ ...definicion, analista: analista?.nombre || definicion.analista }} personasInformadasInicial={personasInformadas} />;
}
