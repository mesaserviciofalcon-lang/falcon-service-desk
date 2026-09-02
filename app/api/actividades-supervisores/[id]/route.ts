import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  fechaHoraColombiaDesdeInput,
  fechaProgramadaConservandoHora,
  inicioDiaColombia,
  mismaFincaActividad,
  normalizarCorreo,
  puedeAdministrarActividades,
  ventanaProgramacionAnalista,
} from "@/lib/actividadesSupervisores";
import { esAnalistaSig } from "@/lib/permisosUsuarios";
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

    if (body.accion === "programarAnalista") {
      const usuario = await prisma.usuario.findUnique({ where: { email: session.user.email }, select: { cargo: true, fincaEAI: true } });
      const ventana = ventanaProgramacionAnalista();
      if (!esAdministrador && (!esAnalistaSig(usuario?.cargo) || !mismaFincaActividad(usuario?.fincaEAI, actividad.finca))) return Response.json({ error: "Solo el Analista SIG de la finca o ADMIN puede programar esta actividad" }, { status: 403 });
      if ((!esAdministrador && !ventana.abierta) || actividad.fechaPlaneada < ventana.inicioMesDestino || actividad.fechaPlaneada >= ventana.finMesDestino) return Response.json({ error: "La programación solo está disponible del 25 al último día del mes para las actividades del mes siguiente" }, { status: 403 });
      const area = texto(body.area);
      const fechaPlaneada = fechaProgramadaConservandoHora(actividad.fechaPlaneada, texto(body.fechaPlaneada));
      const areaValida = await prisma.catalogoActividad.findFirst({ where: { tipo: "AREA", valor: area } });
      if (!fechaPlaneada || !areaValida || fechaPlaneada < ventana.inicioMesDestino || fechaPlaneada >= ventana.finMesDestino) return Response.json({ error: "Seleccione un área y una fecha válida del mes a programar" }, { status: 400 });
      if (fechaPlaneada.getTime() !== actividad.fechaPlaneada.getTime()) {
        const inicioDia = inicioDiaColombia(fechaPlaneada); const finDia = new Date(inicioDia); finDia.setUTCDate(finDia.getUTCDate() + 1);
        const conflicto = await prisma.actividadSupervisor.findFirst({ where: { id: { not: actividad.id }, actividad: { not: "RECOGER EFECTIVO" }, finca: { not: actividad.finca }, fechaPlaneada: { gte: inicioDia, lt: finDia } }, select: { id: true } });
        if (conflicto) return Response.json({ error: "La fecha seleccionada está ocupada por otra finca" }, { status: 409 });
      }
      const actualizado = await prisma.actividadSupervisor.update({ where: { id: actividad.id }, data: { area, fechaPlaneada, programadoPorAnalistaAt: new Date(), recordatorioProgramacionEnviadoAt: null } });
      return Response.json({ ok: true, actividad: actualizado });
    }

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

    if (body.accion === "actualizar") {
      if (!esAdministrador) {
        return Response.json({ error: "No tiene permiso para editar actividades" }, { status: 403 });
      }
      const fechaPlaneada = fechaHoraColombiaDesdeInput(texto(body.fechaPlaneada));
      const finca = texto(body.finca);
      const tipoActividad = texto(body.actividad);
      const area = texto(body.area);
      const catalogos = await prisma.catalogoActividad.findMany({
        where: { OR: [{ tipo: "FINCA", valor: finca }, { tipo: "ACTIVIDAD", valor: tipoActividad }, { tipo: "AREA", valor: area }] },
        select: { tipo: true, valor: true },
      });
      const esValorCatalogo = (tipo: string, valor: string) => catalogos.some((item) => item.tipo === tipo && item.valor === valor);
      if (!fechaPlaneada || !esValorCatalogo("FINCA", finca) || !esValorCatalogo("ACTIVIDAD", tipoActividad) || !esValorCatalogo("AREA", area)) {
        return Response.json({ error: "Seleccione una fecha, finca, actividad y área válidas" }, { status: 400 });
      }
      const correo = normalizarCorreo(body.supervisorCorreo);
      const supervisor = correo ? await prisma.usuario.findUnique({ where: { email: correo }, select: { nombre: true, email: true, rol: true, activo: true } }) : null;
      if (supervisor && (!supervisor.activo || supervisor.rol !== "SUPERVISOR")) {
        return Response.json({ error: "Seleccione un supervisor activo" }, { status: 400 });
      }
      const actualizado = await prisma.actividadSupervisor.update({
        where: { id: actividad.id },
        data: {
          fechaPlaneada,
          fechaPlaneadaFin: null,
          finca,
          actividad: tipoActividad,
          area,
          supervisorNombre: supervisor?.nombre || null,
          supervisorCorreo: supervisor?.email || null,
          estado: supervisor ? (actividad.estado === "TERMINADO" ? "TERMINADO" : "ASIGNADO") : "PENDIENTE_ASIGNAR",
        },
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
      const fechaEjecutada = new Date();
      const limiteCumplimiento = inicioDiaColombia(
        actividad.fechaPlaneada
      );
      limiteCumplimiento.setUTCDate(
        limiteCumplimiento.getUTCDate() + 1
      );
      const actualizado = await prisma.actividadSupervisor.update({
        where: { id: actividad.id },
        data: {
          estado: "TERMINADO",
          observacionesCierre,
          evidencias,
          fechaCierre: fechaEjecutada,
          cumplidaEnFecha:
            fechaEjecutada < limiteCumplimiento,
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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!puedeAdministrarActividades(session?.user?.role)) {
    return Response.json(
      { error: "No tiene permiso para eliminar actividades" },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const actividadId = Number(id);
  if (!Number.isInteger(actividadId)) {
    return Response.json({ error: "Actividad inválida" }, { status: 400 });
  }

  try {
    await prisma.actividadSupervisor.delete({
      where: { id: actividadId },
    });
    return Response.json({ ok: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return Response.json({ error: "Actividad no encontrada" }, { status: 404 });
    }
    console.error(error);
    return Response.json({ error: "No fue posible eliminar la actividad" }, { status: 500 });
  }
}
