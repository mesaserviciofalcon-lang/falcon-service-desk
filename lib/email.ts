import nodemailer
from "nodemailer";

export const transporter =
  nodemailer.createTransport({

    host: "smtp.office365.com",

    port: 587,

    secure: false,

    requireTLS: true,

    auth: {

      user:
        process.env.EMAIL_USER,

      pass:
        process.env.EMAIL_PASS,
    },
  });

export async function enviarCorreo({

  to,

  subject,

  html,

}: {

  to: string;

  subject: string;

  html: string;

}) {

  await transporter.sendMail({

    from:
      process.env.EMAIL_FROM,

    to,

    subject,

    html,
  });
}
