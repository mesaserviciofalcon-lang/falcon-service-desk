import { v2 as cloudinary } from "cloudinary";

import { prisma } from "@/lib/prisma";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {

  try {

    const formData = await request.formData();

    const file = formData.get("file") as File;

    const solicitudId = Number(
      formData.get("solicitudId")
    );

    if (!file) {

      return Response.json(
        { error: "Archivo requerido" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);

    const resultado: any =
      await new Promise((resolve, reject) => {

        cloudinary.uploader.upload_stream(

          {
            resource_type: "auto",
            folder: "falcon-service-desk",
          },

          (error, result) => {

            if (error) reject(error);

            else resolve(result);
          }

        ).end(buffer);
      });

    const archivo =
  await prisma.archivoAdjunto.create({

    data: {

      solicitudId,

      nombre: file.name,

      ruta: resultado.secure_url,

      tipo: file.type,
    },
  });

    return Response.json(archivo);

  } catch (error) {

    console.error(error);

    return Response.json(

      {
        error: "Error subiendo archivo",
      },

      {
        status: 500,
      }
    );
  }
}