import { getServerSession }
from "next-auth";

import bcrypt
from "bcryptjs";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

import {
  cargosUsuario,
  normalizarCargoUsuario,
} from "@/lib/permisosUsuarios";

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

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
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
    const params =
      await context.params;

    const id =
      Number(params.id);

    const body =
      await request.json();

    const cargo =
      normalizarCargoUsuario(
        body.cargo
      );

    if (
      cargo &&
      !cargosUsuario.includes(
        cargo as (typeof cargosUsuario)[number]
      )
    ) {
      return Response.json(
        {
          error: "Cargo no valido",
        },
        {
          status: 400,
        }
      );
    }

    const data: any = {
      nombre: body.nombre,
      email:
        body.email
          ?.trim()
          .toLowerCase(),
      rol: body.rol,
      cargo: cargo || null,
      fincaEAI:
        body.fincaEAI || null,
      activo:
        Boolean(body.activo),
    };

    if (body.password) {
      data.password =
        await bcrypt.hash(
          body.password,
          10
        );
      data.debeCambiarPassword = true;
    }

    const usuario =
      await prisma.usuario.update({

        where: {
          id,
        },

        data,

        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          cargo: true,
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
          "Error actualizando usuario",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
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
    const params =
      await context.params;

    const id =
      Number(params.id);

    if (
      session.user.id === String(id)
    ) {
      return Response.json(
        {
          error:
            "No puede eliminar su propio usuario",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.usuario.delete({
      where: {
        id,
      },
    });

    return Response.json({
      ok: true,
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          "Error eliminando usuario",
      },
      {
        status: 500,
      }
    );
  }
}
