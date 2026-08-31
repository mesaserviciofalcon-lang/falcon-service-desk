import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  normalizarCorreo,
  puedeAdministrarActividades,
} from "@/lib/actividadesSupervisores";
import { prisma } from "@/lib/prisma";

function texto(valor: unknown) {
  return String(valor || "").trim();
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: "Debe iniciar sesión" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const actividad = await prisma.actividadSupervisor.findUnique({ where: { id: Number(id) } });
    if (!actividad) {
      return Response.json({ error: "Actividad no encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const esAdministrador = puedeAdministrarActividades(session.user.role);

    if (body.accion === "asignar") {
      if (!esAdministrador) {
        return Response.json({ error: "No tiene permiso para asignar actividades" }, { status: 403 });
      }
      const correo = normalizarCorreo(body.supervisorCorreo);
      const supervisor = await prisma.usuario.findUnique({
        where: { email: correo },
        select: { nombre: true, email: true, rol: true, activo: true },
      });
      if (!supervisor || !supervisor.activo || supervisor.rol !== "SUPERVISOR") {
        return Response.json({ error: "Seleccione un supervisor activo" }, { status: 400 });
      }
      const actualizado = await prisma.actividadSupervisor.update({
        where: { id: actividad.id },
        data: { supervisorNombre: supervisor.nombre, supervisorCorreo: supervisor.email, estado: "ASIGNADO" },
      });
      return Response.json({ ok: true, actividad: actualizado });
    }

    if (body.accion === "cerrar") {
      const esSupervisorAsignado =
        session.user.role === "SUPERVISOR" &&
        normalizarCorreo(actividad.supervisorCorreo) === normalizarCorreo(session.user.email);
      if (!esSupervisorAsignado) {
        return Response.json({ error: "Solo el supervisor asignado puede cerrar esta actividad" }, { status: 403 });
      }
      if (actividad.estado === "TERMINADO") {
        return Response.json({ error: "La actividad ya está terminada" }, { status: 400 });
      }
      const observacionesCierre = texto(body.observacionesCierre);
      const evidencias = Array.isArray(body.evidencias) ? body.evidencias : [];
      if (!observacionesCierre || evidencias.length === 0) {
        return Response.json({ error: "Registre la gestión y adjunte al menos una evidencia" }, { status: 400 });
      }
      const actualizado = await prisma.actividadSupervisor.update({
        where: { id: actividad.id },
        data: {
          estado: "TERMINADO",
          observacionesCierre,
          evidencias,
          fechaCierre: new Date(),
          cerradoPor: session.user.name || session.user.email,
          cerradoPorCorreo: session.user.email,
        },
      });
      return Response.json({ ok: true, actividad: actualizado });
    }

    return Response.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "No fue posible actualizar la actividad" }, { status: 500 });
  }
}
