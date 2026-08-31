import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

const rolesPuedeAgregarObservacion = [
  "ADMIN",
  "DIRECTOR_SEG",
  "JEFE_SEG",
  "SUPERVISOR",
];

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const session =
    await getServerSession(
      authOptions
    );

  if (!session?.user?.email) {
    return Response.json(
      {
        error:
          "Debe iniciar sesion",
      },
      {
        status: 401,
      }
    );
  }

  const role =
    session.user.role || "";

  if (
    !rolesPuedeAgregarObservacion.includes(
      role
    )
  ) {
    return Response.json(
      {
        error:
          "No tiene permiso para agregar observaciones",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const params =
      await context.params;
    const id =
      Number(params.id);

    if (!Number.isFinite(id)) {
      return Response.json(
        {
          error:
            "Analisis invalido",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await request.json();
    const observacion =
      String(
        body.observacion || ""
      ).trim();
    const supervisor =
      String(
        session.user.name ||
          session.user.email ||
          ""
      ).trim();

    if (!supervisor) {
      return Response.json(
        {
          error:
            "No fue posible identificar al usuario que registra la observacion",
        },
        {
          status: 400,
        }
      );
    }

    if (!observacion) {
      return Response.json(
        {
          error:
            "Debe escribir la observacion de seguimiento",
        },
        {
          status: 400,
        }
      );
    }

    const informe =
      await prisma
        .vulnerabilidadInforme
        .findUnique({
          where: {
            id,
          },
          select: {
            id: true,
            estado: true,
          },
        });

    if (!informe) {
      return Response.json(
        {
          error:
            "Analisis no encontrado",
        },
        {
          status: 404,
        }
      );
    }

    if (
      informe.estado ===
      "CERRADO"
    ) {
      return Response.json(
        {
          error:
            "No se pueden agregar observaciones a un analisis cerrado",
        },
        {
          status: 400,
        }
      );
    }

    const registro =
      await prisma
        .vulnerabilidadObservacion
        .create({
          data: {
            informeId:
              id,
            observacion,
            supervisor,
            usuarioNombre:
              session.user.name ||
              null,
            usuarioCorreo:
              session.user.email,
          },
        });

    return Response.json({
      ok: true,
      observacion:
        registro,
    });
  } catch (error: any) {
    console.error(error);

    return Response.json(
      {
        error:
          error.message ||
          "Error agregando observacion",
      },
      {
        status: 500,
      }
    );
  }
}
