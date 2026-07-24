import {

  NextResponse,

} from "next/server";

import {
  createHash,
} from "crypto";

import bcrypt
from "bcryptjs";

import {

  prisma,

} from "@/lib/prisma";

export async function POST(
  request: Request
) {

  try {

    const body =
      await request.json();

    const {

      token,

      password,

    } = body;

    // VALIDAR PASSWORD

    const passwordRegex =

      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&._-])[A-Za-z\d@$!%*#?&._-]{8,}$/;

    if (
      !passwordRegex.test(
        password
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

    // BUSCAR TOKEN

    const tokenHash =
      createHash("sha256")
        .update(String(token || ""))
        .digest("hex");

    const resetToken =
      await prisma.passwordResetToken.findUnique({

        where: {

          token:
            tokenHash,
        },
      });

    if (!resetToken) {

      return NextResponse.json(

        {

          error:
            "Token inválido",
        },

        {

          status: 400,
        }
      );
    }

    // VALIDAR EXPIRACIÓN

    if (

      new Date() >

      resetToken.expiresAt

    ) {

      return NextResponse.json(

        {

          error:
            "Token expirado",
        },

        {

          status: 400,
        }
      );
    }

    // HASH PASSWORD

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    // ACTUALIZAR USUARIO

    await prisma.usuario.update({

      where: {

        email:
          resetToken.email,
      },

      data: {

        password:
          hashedPassword,
      },
    });

    // ELIMINAR TOKEN

    await prisma.passwordResetToken.delete({

      where: {

        token:
          tokenHash,
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
          "Error actualizando contraseña",
      },

      {

        status: 500,
      }
    );
  }
}
