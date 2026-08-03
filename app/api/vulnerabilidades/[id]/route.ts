import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

const rolesSeguridad = [
  "ADMIN",
  "DIRECTOR_SEG",
  "JEFE_SEG",
  "SUPERVISOR",
];

function puedeCerrar(
  informe: {
    analistaSigCorreo: string | null;
  },
  session: any
) {
  const role =
    session?.user?.role || "";
  const email =
    session?.user?.email || "";

  return (
    rolesSeguridad.includes(role) ||
    informe.analistaSigCorreo === email
  );
}

export async function PATCH(
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

  try {
    const params =
      await context.params;
    const id =
      Number(params.id);

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
            analistaSigCorreo: true,
          },
        });

    if (!informe) {
      return Response.json(
        {
          error:
            "Informe no encontrado",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !puedeCerrar(
        informe,
        session
      )
    ) {
      return Response.json(
        {
          error:
            "No tiene permiso para cerrar este analisis",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      await request.json();
    const observaciones =
      String(
        body.observaciones || ""
      ).trim();
    const evidencias =
      Array.isArray(body.evidencias)
        ? body.evidencias
        : [];

    if (!observaciones) {
      return Response.json(
        {
          error:
            "Debe registrar observaciones de cierre",
        },
        {
          status: 400,
        }
      );
    }

    if (evidencias.length === 0) {
      return Response.json(
        {
          error:
            "Debe adjuntar evidencia de cierre",
        },
        {
          status: 400,
        }
      );
    }

    const actualizado =
      await prisma
        .vulnerabilidadInforme
        .update({
          where: {
            id,
          },
          data: {
            estado: "CERRADO",
            cierreObservaciones:
              observaciones,
            cierreEvidencias:
              evidencias,
            cerradoPor:
              session.user.name ||
              "Usuario",
            cerradoPorCorreo:
              session.user.email,
            fechaCierre:
              new Date(),
          },
        });

    return Response.json({
      ok: true,
      informe:
        actualizado,
    });
  } catch (error: any) {
    console.error(error);

    return Response.json(
      {
        error:
          error.message ||
          "Error cerrando analisis",
      },
      {
        status: 500,
      }
    );
  }
}
