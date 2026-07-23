import { getServerSession }
from "next-auth";

import bcrypt
from "bcryptjs";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

async function validarAdmin() {
  const session =
    await getServerSession(
      authOptions
    );

  if (
    session?.user?.role !==
    "ADMIN"
  ) {
    return null;
  }

  return session;
}

export async function POST(
  request: Request
) {
  const session =
    await validarAdmin();

  if (!session) {
    return Response.json(
      {
        error:
          "No autorizado",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const body =
      await request.json();

    if (
      !body.nombre ||
      !body.email ||
      !body.password ||
      !body.rol
    ) {
      return Response.json(
        {
          error:
            "Nombre, correo, contraseña y rol son obligatorios",
        },
        {
          status: 400,
        }
      );
    }

    const password =
      await bcrypt.hash(
        body.password,
        10
      );

    const usuario =
      await prisma.usuario.create({

        data: {
          nombre: body.nombre,
          email:
            body.email
              .trim()
              .toLowerCase(),
          password,
          rol: body.rol,
          fincaEAI:
            body.fincaEAI || null,
          activo:
            body.activo ?? true,
        },

        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          fincaEAI: true,
          activo: true,
          createdAt: true,
        },
      });

    return Response.json(
      usuario
    );

  } catch (error: any) {
    console.error(error);

    if (
      error.code === "P2002"
    ) {
      return Response.json(
        {
          error:
            "Ya existe un usuario con ese correo",
        },
        {
          status: 400,
        }
      );
    }

    return Response.json(
      {
        error:
          "Error creando usuario",
      },
      {
        status: 500,
      }
    );
  }
}
