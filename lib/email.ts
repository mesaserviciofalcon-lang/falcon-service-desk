import nodemailer
from "nodemailer";

const emailFrom =
  process.env.EMAIL_FROM ||
  "Falcon Service Desk <sala.control@falconfarms.com.co>";

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

  cc,

  subject,

  html,

  attachments,

}: {

  to: string;

  cc?: string;

  subject: string;

  html: string;

  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;

}) {

  await transporter.sendMail({

    from:
      emailFrom,

    to,

    cc,

    subject,

    html,

    attachments,
  });
}
