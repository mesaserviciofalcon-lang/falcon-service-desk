import {

  NextResponse,

} from "next/server";

import {

  prisma,

} from "@/lib/prisma";

import {

  enviarCorreo,

} from "@/lib/email";

import {

  createHash,

  randomBytes,

} from "crypto";

import { getAppUrl }
from "@/lib/appUrl";

export async function POST(
  request: Request
) {

  try {

    const body =
      await request.json();

    const {

      email,

    } = body;

    const usuario =
      await prisma.usuario.findUnique({

        where: {

          email,
        },
      });

    if (!usuario) {

      return NextResponse.json({

        success: true,
      });
    }

    // GENERAR TOKEN

    const token =
      randomBytes(32)
        .toString("hex");

    const tokenHash =
      createHash("sha256")
        .update(token)
        .digest("hex");

    // EXPIRACIÓN 1 HORA

    const expiresAt =
      new Date(
        Date.now() +
        1000 * 60 * 60
      );

    // GUARDAR TOKEN

    await prisma.passwordResetToken.deleteMany({
      where: {
        email,
      },
    });

    await prisma.passwordResetToken.create({

      data: {

        email,

        token:
          tokenHash,

        expiresAt,
      },
    });

    // LINK RESET

    const resetLink =

      `${getAppUrl()}/reset-password?token=${token}`;

    // ENVIAR EMAIL

    await enviarCorreo({

  to: email,

  subject:
    "Recuperación de contraseña",

  html: `

    <div style="
      font-family: Arial;
      padding: 20px;
    ">

      <h1>
        Recuperar contraseña
      </h1>

      <p>
        Se solicitó un cambio de contraseña.
      </p>

      <p>
        Haz click en el siguiente botón:
      </p>

      <a
        href="${resetLink}"
        style="
          display: inline-block;
          background: #0F3D1F;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          text-decoration: none;
          margin-top: 10px;
        "
      >

        Cambiar contraseña

      </a>

      <p style="
        margin-top: 20px;
        color: gray;
      ">

        Este enlace expira en 1 hora.

      </p>

    </div>
  `,
});

    return NextResponse.json({

      success: true,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(

      {

        error:
          "Error enviando correo",
      },

      {

        status: 500,
      }
    );
  }
}
