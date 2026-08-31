import {

  NextResponse,

} from "next/server";

import bcrypt
from "bcryptjs";

import {

  getServerSession,

} from "next-auth/next";

import {

  authOptions,

} from "@/lib/auth";

import {

  prisma,

} from "@/lib/prisma";

export async function POST(
  request: Request
) {

  try {

    const session =
      await getServerSession(
        authOptions
      );

    if (
      !session?.user?.email
    ) {

      return NextResponse.json(

        {

          error:
            "No autorizado",
        },

        {

          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const {

      actual,

      nueva,

    } = body;

    // VALIDAR PASSWORD FUERTE

    const passwordRegex =

      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&._-])[A-Za-z\d@$!%*#?&._-]{8,}$/;

    if (
      !passwordRegex.test(
        nueva
      )
    ) {

      return NextResponse.json(

        {

          error:
            "La contraseña debe tener mínimo 8 caracteres, letras, números y un símbolo",
        },

        {

          status: 400,
        }
      );
    }

    const usuario =
      await prisma.usuario.findUnique({

        where: {

          email:
            session.user.email,
        },
      });

    if (!usuario) {

      return NextResponse.json(

        {

          error:
            "Usuario no encontrado",
        },

        {

          status: 404,
        }
      );
    }

    const passwordCorrecta =
      await bcrypt.compare(

        actual,

        usuario.password
      );

    if (!passwordCorrecta) {

      return NextResponse.json(

        {

          error:
            "La contraseña actual es incorrecta",
        },

        {

          status: 400,
        }
      );
    }

    const nuevaPasswordHash =
      await bcrypt.hash(
        nueva,
        10
      );

    await prisma.usuario.update({

      where: {

        id:
          usuario.id,
      },

      data: {

        password:
          nuevaPasswordHash,

        debeCambiarPassword:
          false,
      },
    });

    return NextResponse.json({

      success: true,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(

      {

        error:
          "Error interno del servidor",
      },

      {

        status: 500,
      }
    );
  }
}
