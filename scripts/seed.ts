import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {

  const adminPassword =
    await bcrypt.hash(
      "Admin123*",
      10
    );

  const tecnicoPassword =
    await bcrypt.hash(
      "Tecnico123*",
      10
    );

  const adrianaPassword =
    await bcrypt.hash(
      "Adriana123*",
      10
    );

  // ADMIN

  await prisma.usuario.upsert({

    where: {
      email:
        "admin@falconfarms.com.co",
    },

    update: {},

    create: {

      nombre:
        "Cristian",

      email:
        "admin@falconfarms.com.co",

      password:
        adminPassword,

      rol:
        "ADMIN",
    },
  });

  // TECNICO

  await prisma.usuario.upsert({

    where: {
      email:
        "tecnico@falconfarms.com.co",
    },

    update: {},

    create: {

      nombre:
        "Tecnico",

      email:
        "tecnico@falconfarms.com.co",

      password:
        tecnicoPassword,

      rol:
        "TECNICO",
    },
  });

  // ADRIANA

  await prisma.usuario.upsert({

    where: {
      email:
        "adriana.garcia@falconfarms.com.co",
    },

    update: {},

    create: {

      nombre:
        "ADRIANA GARCIA",

      email:
        "adriana.garcia@falconfarms.com.co",

      password:
        adrianaPassword,

      rol:
        "VISITA",
    },
  });

  console.log(
    "Usuarios creados correctamente"
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