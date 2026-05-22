import { writeFile }
from "fs/promises";

import { NextResponse }
from "next/server";

import { v4 as uuidv4 }
from "uuid";

import path
from "path";

import { prisma }
from "@/lib/prisma";

export async function POST(
  request: Request
) {

  try {

    const data =
      await request.formData();

    const file =
      data.get("file") as File;

    const solicitudId =
      data.get(
        "solicitudId"
      ) as string;

    if (!file) {

      return NextResponse.json(

        {
          error:
            "No hay archivo",
        },

        {
          status: 400,
        }
      );
    }

    const bytes =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(bytes);

    const extension =
      file.name
        .split(".")
        .pop();

    const fileName =
      `${uuidv4()}.${extension}`;

    const filePath =
      path.join(

        process.cwd(),

        "public/uploads",

        fileName
      );

    await writeFile(
      filePath,
      buffer
    );

    // GUARDAR EN BD

    const archivo =
      await prisma.archivoAdjunto.create({

        data: {

          solicitudId:
            Number(
              solicitudId
            ),

          nombre:
            file.name,

          ruta:
            `/uploads/${fileName}`,

          tipo:
            file.type,
        },
      });

    return NextResponse.json({

      success: true,

      archivo,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(

      {
        error:
          "Error al subir archivo",
      },

      {
        status: 500,
      }
    );
  }
}