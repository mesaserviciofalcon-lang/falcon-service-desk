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

  v4 as uuidv4,

} from "uuid";

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
      uuidv4();

    // EXPIRACIÓN 1 HORA

    const expiresAt =
      new Date(
        Date.now() +
        1000 * 60 * 60
      );

    // GUARDAR TOKEN

    await prisma.passwordResetToken.create({

      data: {

        email,

        token,

        expiresAt,
      },
    });

    // LINK RESET

    const resetLink =

      `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

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