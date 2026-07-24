import { prisma }
from "@/lib/prisma";

import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

const rolesGestores = [
  "ADMIN",
  "DIRECTOR_SEG",
  "JEFE_SEG",
  "SUPERVISOR",
  "VISITA",
  "TECNICO",
];

export async function POST(
  request: Request
) {

  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user?.email) {
      return Response.json(
        {
          error:
            "Debe iniciar sesion para adjuntar archivos",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const solicitudId =
      Number(body.solicitudId);

    if (
      !solicitudId ||
      !body.nombre ||
      !body.ruta ||
      !body.tipo
    ) {
      return Response.json(
        {
          error:
            "Datos de archivo incompletos",
        },
        {
          status: 400,
        }
      );
    }

    const solicitud =
      await prisma.solicitud.findUnique({
        where: {
          id: solicitudId,
        },
        include: {
          antecedente: true,
        },
      });

    const esSolicitantePropio =
      solicitud?.correoSolicitante ===
      session.user.email;

    const esAntecedenteMismaFinca =
      solicitud?.tipo ===
      "ANTECEDENTES" &&
      Boolean(
        session.user.fincaEAI
      ) &&
      solicitud.antecedente?.fincaEAI ===
        session.user.fincaEAI;

    const esGestor =
      rolesGestores.includes(
        session.user.role || ""
      );

    if (
      !solicitud ||
      (!esGestor &&
        !esSolicitantePropio &&
        !esAntecedenteMismaFinca)
    ) {
      return Response.json(
        {
          error:
            "No tiene permiso para adjuntar archivos a este ticket",
        },
        {
          status: 403,
        }
      );
    }

    const archivo =
      await prisma.archivoAdjunto.create({

        data: {

          solicitudId:
            solicitudId,

          nombre:
            body.nombre,

          ruta:
            body.ruta,

          tipo:
            body.tipo,
        },
      });

    return Response.json(
      archivo
    );

  } catch (error) {

    console.error(error);

    return Response.json(

      {
        error:
          "Error guardando archivo",
      },

      {
        status: 500,
      }
    );
  }
}
