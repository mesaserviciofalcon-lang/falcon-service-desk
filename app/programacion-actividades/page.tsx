import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import ProgramacionActividadesPanel from "@/components/ProgramacionActividadesPanel";
import { authOptions } from "@/lib/auth";
import { ventanaProgramacionAnalista } from "@/lib/actividadesSupervisores";
import { esAnalistaSig } from "@/lib/permisosUsuarios";
import { analistaTieneAccesoAFinca } from "@/lib/fincasAnalistaSig";
import { prisma } from "@/lib/prisma";

export default async function ProgramacionActividadesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");
  const esAdministrador = session.user.role === "ADMIN";
  const usuario = await prisma.usuario.findUnique({ where: { email: session.user.email }, select: { nombre: true, cargo: true, fincaEAI: true } });
  const esAnalistaAsignado = esAnalistaSig(usuario?.cargo) && Boolean(usuario?.fincaEAI);
  if (!esAdministrador && !esAnalistaAsignado) redirect("/dashboard");

  const ventana = ventanaProgramacionAnalista();
  const [actividadesMes, actividadesOcupadas, catalogos] = await Promise.all([
    prisma.actividadSupervisor.findMany({ where: { finca: { not: "" }, actividad: { not: "RECOGER EFECTIVO" }, fechaPlaneada: { gte: ventana.inicioMesDestino, lt: ventana.finMesDestino } }, orderBy: { fechaPlaneada: "asc" }, select: { id: true, fechaPlaneada: true, finca: true, actividad: true, area: true, estado: true, programadoPorAnalistaAt: true } }),
    prisma.actividadSupervisor.findMany({ where: { actividad: { not: "RECOGER EFECTIVO" }, fechaPlaneada: { gte: ventana.inicioMesDestino, lt: ventana.finMesDestino } }, select: { id: true, finca: true, fechaPlaneada: true } }),
    prisma.catalogoActividad.findMany({ where: { tipo: "AREA" }, orderBy: { valor: "asc" }, select: { valor: true } }),
  ]);
  const actividades = esAdministrador ? actividadesMes : actividadesMes.filter((actividad) => analistaTieneAccesoAFinca(usuario, actividad.finca));
  return <ProgramacionActividadesPanel ventanaAbierta={ventana.abierta} puedeControlar={esAdministrador} etiquetaMes={ventana.etiquetaMes} etiquetaVentana={ventana.etiquetaMesActual} etiquetaUltimoDiaVentana={ventana.etiquetaUltimoDiaVentana} actividades={actividades.map((actividad) => ({ ...actividad, fechaPlaneada: actividad.fechaPlaneada.toISOString(), programadoPorAnalistaAt: actividad.programadoPorAnalistaAt?.toISOString() || null }))} ocupadas={actividadesOcupadas.map((actividad) => ({ ...actividad, fechaPlaneada: actividad.fechaPlaneada.toISOString() }))} areas={catalogos.map((catalogo) => catalogo.valor)} />;
}
