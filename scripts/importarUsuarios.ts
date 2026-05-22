import * as XLSX
from "xlsx";

import bcrypt
from "bcryptjs";

import { prisma }
from "@/lib/prisma";

async function main() {

  const workbook =
    XLSX.readFile(
      "BDUSUARIOS.xlsx"
    );

  const sheetName =
    workbook.SheetNames[0];

  const sheet =
    workbook.Sheets[sheetName];

  const usuarios =
    XLSX.utils.sheet_to_json(sheet);

  for (const usuario of usuarios as any[]) {

    try {

      const existe =
        await prisma.usuario.findUnique({

          where: {
            email:
              usuario.email,
          },
        });

      if (existe) {

        console.log(
          `Usuario ya existe: ${usuario.email}`
        );

        continue;
      }

      // VALIDAR PASSWORD

      const passwordTexto =
        String(
          usuario.password || "123456"
        );

      const passwordHash =
        await bcrypt.hash(
          passwordTexto,
          10
        );

      await prisma.usuario.create({

        data: {

          nombre:
            usuario.nombre,

          email:
            usuario.email,

          password:
            passwordHash,

          rol:
            usuario.rol,

          fincaEAI:
            usuario["finca EAI"],
        },
      });

      console.log(
        `Usuario creado: ${usuario.email}`
      );

    } catch (error) {

      console.error(
        `Error usuario: ${usuario.email}`
      );

      console.error(error);
    }
  }

  console.log(
    "Importación completada"
  );
}

main()

  .catch((e) => {

    console.error(e);

    process.exit(1);
  })

  .finally(async () => {

    await prisma.$disconnect();
  });