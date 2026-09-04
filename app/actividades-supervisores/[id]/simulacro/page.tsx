import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import FormularioSimulacro from "@/components/FormularioSimulacro";
import { authOptions } from "@/lib/auth";
import { normalizarCorreo, puedeAdministrarActividades } from "@/lib/actividadesSupervisores";
import { definicionSimulacro, esActividadSimulacro } from "@/lib/simulacros";
import { prisma } from "@/lib/prisma";
import { esAnalistaSig } from "@/lib/permisosUsuarios";
import { analistaTieneAccesoAFinca } from "@/lib/fincasAnalistaSig";

export default async function SimulacroActividadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const actividad = await prisma.actividadSupervisor.findUnique({ where: { id: Number(id) }, include: { simulacro: true } });
  if (!actividad || !esActividadSimulacro(actividad.actividad)) notFound();
  const esSupervisorAsignado = session?.user?.role === "SUPERVISOR" && normalizarCorreo(actividad.supervisorCorreo) === normalizarCorreo(session.user.email);
  const esAdministrador = puedeAdministrarActividades(session?.user?.role);
  if (!esSupervisorAsignado && !esAdministrador) redirect("/dashboard");
  if (actividad.simulacro) redirect(`/actividades-supervisores/${actividad.id}/simulacro/pdf`);
  const definicion = definicionSimulacro(actividad.actividad, actividad.area, actividad.finca);
  if (!definicion) notFound();
  const usuarios = await prisma.usuario.findMany({ where: { activo: true }, select: { nombre: true, cargo: true, rol: true, fincaEAI: true } });
  const analistas = usuarios.filter((usuario) => esAnalistaSig(usuario.cargo) && analistaTieneAccesoAFinca(usuario, actividad.finca));
  const personasFijas = usuarios.filter((usuario) => ["JEFE_SEG", "DIRECTOR_SEG"].includes(usuario.rol) || ["JEFE SEG", "DIRECTOR SEG"].includes(String(usuario.cargo || ""))).map((usuario) => `${usuario.nombre} - ${usuario.cargo || usuario.rol}`);
  const personasInformadas = [
    ...(analistas.length ? analistas.map((analista) => `${analista.nombre} - ANALISTA SIG`) : [`${definicion.analista} - ANALISTA SIG`]),
    ...personasFijas,
  ].join(" / ");
  return <FormularioSimulacro actividad={actividad} definicion={{ ...definicion, analista: analistas[0]?.nombre || definicion.analista }} personasInformadasInicial={personasInformadas} />;
}
