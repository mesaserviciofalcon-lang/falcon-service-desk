import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { fechaHoraColombiaDesdeInput, puedeAdministrarActividades } from "@/lib/actividadesSupervisores";
import { prisma } from "@/lib/prisma";

function texto(valor: unknown) {
  return String(valor || "").trim();
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!puedeAdministrarActividades(session?.user?.role)) {
    return Response.json({ error: "No tiene permiso para crear actividades" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const fechaPlaneada = fechaHoraColombiaDesdeInput(texto(body.fechaPlaneada));
    const finca = texto(body.finca);
    const actividad = texto(body.actividad);
    const area = texto(body.area);

    if (!fechaPlaneada || !finca || !actividad) {
      return Response.json({ error: "Fecha, finca y actividad son obligatorias" }, { status: 400 });
    }

    const supervisorCorreo = texto(body.supervisorCorreo).toLowerCase();
    const supervisor = supervisorCorreo
      ? await prisma.usuario.findUnique({
          where: { email: supervisorCorreo },
          select: { nombre: true, email: true, rol: true, activo: true },
        })
      : null;

    if (supervisor && (!supervisor.activo || supervisor.rol !== "SUPERVISOR")) {
      return Response.json({ error: "El usuario seleccionado no es un supervisor activo" }, { status: 400 });
    }

    const registro = await prisma.actividadSupervisor.create({
      data: {
        fechaPlaneada,
        fechaPlaneadaFin: body.fechaPlaneadaFin ? fechaHoraColombiaDesdeInput(texto(body.fechaPlaneadaFin)) : null,
        finca,
        actividad,
        area: area || null,
        supervisorNombre: supervisor?.nombre || null,
        supervisorCorreo: supervisor?.email || null,
        estado: supervisor ? "ASIGNADO" : "PENDIENTE_ASIGNAR",
        creadoPor: session?.user?.name || null,
        creadoPorCorreo: session?.user?.email || null,
      },
    });

    return Response.json({ ok: true, actividad: registro });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "No fue posible crear la actividad" }, { status: 500 });
  }
}
