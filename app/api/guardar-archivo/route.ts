import { prisma }
from "@/lib/prisma";

export async function POST(
  request: Request
) {

  try {

    const body =
      await request.json();

    const archivo =
      await prisma.archivoAdjunto.create({

        data: {

          solicitudId:
            body.solicitudId,

          nombre:
            body.nombre,

          ruta:
            body.ruta,

          tipo:
            body.tipo,
        },
      });

    return Response.json(
      archivo
    );

  } catch (error) {

    console.error(error);

    return Response.json(

      {
        error:
          "Error guardando archivo",
      },

      {
        status: 500,
      }
    );
  }
}