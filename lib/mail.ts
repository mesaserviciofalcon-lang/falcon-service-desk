import nodemailer
from "nodemailer";

const transporter =
  nodemailer.createTransport({

    host:
      process.env.EMAIL_SERVER,

    port:
      Number(
        process.env.EMAIL_PORT
      ),

    secure: false,

    auth: {

      user:
        process.env.EMAIL_USER,

      pass:
        process.env.EMAIL_PASS,
    },
  });

export async function enviarCorreo({

  para,

  asunto,

  html,

}: {

  para: string;

  asunto: string;

  html: string;

}) {

  try {

    await transporter.sendMail({

      from:
        process.env.EMAIL_FROM,

      to: para,

      subject: asunto,

      html,
    });

    console.log(
      "Correo enviado a:",
      para
    );

  } catch (error) {

    console.error(

      "Error enviando correo:",

      error
    );
  }
}