import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import XLSX from "xlsx";

import {
  cargosUsuario,
  normalizarCargoUsuario,
} from "../lib/permisosUsuarios";

const EMAIL_CAMILO =
  "camilo.orjuela@falconfarms.com.co";

const rolesPermitidos = new Set([
  "ADMIN",
  "SOLICITANTE",
  "SUPERVISOR",
  "VISITA",
  "TECNICO",
  "JEFE_SEG",
  "DIRECTOR_SEG",
]);

type FilaUsuarioExcel = {
  nombre: string;
  email: string;
  rol: string;
  fincaEAI: string;
  cargo: string;
};

function texto(valor: unknown) {
  return String(valor || "").trim();
}

function leerUsuarios(
  rutaArchivo: string
): FilaUsuarioExcel[] {
  const libro = XLSX.readFile(rutaArchivo);
  const hoja = libro.Sheets.USUARIOS;

  if (!hoja) {
    throw new Error(
      "El archivo debe tener una hoja llamada USUARIOS"
    );
  }

  const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    hoja,
    { defval: "" }
  );

  const usuarios = filas.map((fila, indice) => {
    const nombre = texto(fila["NOMBRE USUARIO"]);
    const email = texto(fila["CORREO USUARIO"])
      .toLowerCase();
    const rol = texto(fila.ROL).toUpperCase();
    const fincaEAI = texto(fila.EAI).toUpperCase();
    const cargo = normalizarCargoUsuario(
      texto(fila.CARGO)
    );

    if (
      !nombre ||
      !email ||
      !rol ||
      !fincaEAI ||
      !cargo
    ) {
      throw new Error(
        `La fila ${indice + 2} tiene campos obligatorios vacios`
      );
    }

    if (!rolesPermitidos.has(rol)) {
      throw new Error(
        `La fila ${indice + 2} tiene un rol no valido: ${rol}`
      );
    }

    if (
      !cargosUsuario.includes(
        cargo as (typeof cargosUsuario)[number]
      )
    ) {
      throw new Error(
        `La fila ${indice + 2} tiene un cargo no valido: ${cargo}`
      );
    }

    return {
      nombre,
      email,
      rol,
      fincaEAI,
      cargo,
    };
  });

  const correos = new Set<string>();

  for (const usuario of usuarios) {
    if (correos.has(usuario.email)) {
      throw new Error(
        `El correo ${usuario.email} esta repetido en el Excel`
      );
    }

    correos.add(usuario.email);
  }

  return usuarios;
}

async function main() {
  const rutaArchivo = process.argv[2];
  const aplicar = process.argv.includes("--apply");
  const passwordInicial =
    process.env.USUARIOS_PASSWORD_INICIAL;

  if (!rutaArchivo) {
    throw new Error(
      "Indique la ruta del archivo Excel"
    );
  }

  if (!aplicar) {
    throw new Error(
      "Use --apply para ejecutar cambios en la base de datos"
    );
  }

  if (!passwordInicial) {
    throw new Error(
      "Defina USUARIOS_PASSWORD_INICIAL para las cuentas nuevas"
    );
  }

  const usuariosExcel = leerUsuarios(rutaArchivo);
  const prisma = new PrismaClient();

  try {
    const existentes =
      await prisma.usuario.findMany({
        select: {
          email: true,
        },
      });
    const correosExistentes = new Set(
      existentes.map((usuario) =>
        usuario.email.toLowerCase()
      )
    );
    const nuevos = usuariosExcel.filter(
      (usuario) =>
        !correosExistentes.has(usuario.email)
    );
    const passwordHash =
      nuevos.length > 0
        ? await bcrypt.hash(passwordInicial, 10)
        : null;

    await prisma.$transaction(
      async (tx) => {
        for (const usuario of usuariosExcel) {
        const data = {
          nombre: usuario.nombre,
          rol: usuario.rol,
          cargo: usuario.cargo,
          fincaEAI: usuario.fincaEAI,
          activo: true,
        };

        if (correosExistentes.has(usuario.email)) {
          await tx.usuario.update({
            where: { email: usuario.email },
            data,
          });
          continue;
        }

        await tx.usuario.create({
          data: {
            ...data,
            email: usuario.email,
            password: passwordHash!,
            debeCambiarPassword: true,
          },
        });
      }

        await tx.usuario.deleteMany({
          where: {
            email: EMAIL_CAMILO,
          },
        });
      },
      {
        maxWait: 10_000,
        timeout: 60_000,
      }
    );

    console.log(
      JSON.stringify({
        actualizados: usuariosExcel.length - nuevos.length,
        creados: nuevos.length,
        eliminados: [EMAIL_CAMILO],
      })
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
