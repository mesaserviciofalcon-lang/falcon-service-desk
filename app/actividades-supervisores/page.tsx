import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import ActividadesSupervisoresPanel from "@/components/ActividadesSupervisoresPanel";
import { authOptions } from "@/lib/auth";
import { puedeAdministrarActividades } from "@/lib/actividadesSupervisores";
import { prisma } from "@/lib/prisma";

export default async function ActividadesSupervisoresPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "";
  const email = String(session?.user?.email || "").trim().toLowerCase();
  const esAdministrador = puedeAdministrarActividades(role);

  if (!esAdministrador && role !== "SUPERVISOR") redirect("/dashboard");

  const [actividades, supervisores, catalogos] = await Promise.all([
    prisma.actividadSupervisor.findMany({
      where: esAdministrador
        ? undefined
        : {
            supervisorCorreo: email,
            estado: { not: "TERMINADO" },
          },
      orderBy: { fechaPlaneada: "asc" },
      select: { id: true, fechaPlaneada: true, finca: true, actividad: true, area: true, supervisorNombre: true, supervisorCorreo: true, estado: true, fechaCierre: true, cumplidaEnFecha: true },
    }),
    esAdministrador
      ? prisma.usuario.findMany({ where: { activo: true, rol: "SUPERVISOR" }, orderBy: { nombre: "asc" }, select: { nombre: true, email: true } })
      : Promise.resolve([]),
    esAdministrador
      ? prisma.catalogoActividad.findMany({ orderBy: { valor: "asc" }, select: { tipo: true, valor: true } })
      : Promise.resolve([]),
  ]);

  return <ActividadesSupervisoresPanel actividades={actividades.map((actividad) => ({ ...actividad, fechaPlaneada: actividad.fechaPlaneada.toISOString(), fechaCierre: actividad.fechaCierre?.toISOString() || null }))} supervisores={supervisores} catalogos={catalogos} puedeAdministrar={esAdministrador} />;
}
