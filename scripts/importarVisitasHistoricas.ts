import path
from "path";

import * as XLSX
from "xlsx";

import { PrismaClient }
from "@prisma/client";

const prisma =
  new PrismaClient();

const archivo =
  process.argv[2] ||
  "C:/Users/crito/Downloads/Cuadro_Requerimiento (8).xlsx";

const hojaEsperada =
  "Form2";

function limpiarTexto(
  valor: unknown
) {
  return String(valor || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizarCedula(
  valor: unknown
) {
  return String(valor || "")
    .replace(/\D/g, "")
    .trim();
}

function formatearFecha(
  valor: unknown
) {
  if (!valor) {
    return "";
  }

  if (
    valor instanceof Date &&
    !Number.isNaN(valor.getTime())
  ) {
    return valor.toLocaleDateString(
      "es-CO",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "America/Bogota",
      }
    );
  }

  return limpiarTexto(valor);
}

function parsearFecha(
  valor: unknown
) {
  if (!valor) {
    return null;
  }

  if (valor instanceof Date) {
    return fechaEnRango(valor);
  }

  let texto =
    limpiarTexto(valor)
      .replace(/\s*\/\s*/g, "/")
      .replace(/\s*-\s*/g, "-");

  if (
    !texto ||
    texto.toUpperCase().includes(
      "CANCEL"
    )
  ) {
    return null;
  }

  const sinSegundoSlash =
    texto.match(
      /^(\d{1,2})\/(\d{2})(\d{4})$/
    );

  if (sinSegundoSlash) {
    texto = `${sinSegundoSlash[1]}/${sinSegundoSlash[2]}/${sinSegundoSlash[3]}`;
  }

  const partes =
    texto.match(
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/
    );

  if (partes) {
    const dia =
      Number(partes[1]);

    const mes =
      Number(partes[2]) - 1;

    const anio =
      partes[3].length === 2
        ? 2000 + Number(partes[3])
        : Number(partes[3]);

    const fecha =
      new Date(anio, mes, dia);

    return fechaEnRango(fecha);
  }

  const fecha =
    new Date(texto);

  return fechaEnRango(fecha);
}

function fechaEnRango(
  fecha: Date
) {
  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return null;
  }

  const anio =
    fecha.getFullYear();

  if (
    anio < 1900 ||
    anio > 2100
  ) {
    return null;
  }

  return fecha;
}

async function main() {
  const workbook =
    XLSX.readFile(archivo, {
      cellDates: true,
    });

  const worksheet =
    workbook.Sheets[hojaEsperada];

  if (!worksheet) {
    throw new Error(
      `No se encontro la hoja ${hojaEsperada}`
    );
  }

  const filas =
    XLSX.utils.sheet_to_json<unknown[]>(
      worksheet,
      {
        header: 1,
        defval: "",
        raw: true,
      }
    );

  const origenArchivo =
    path.basename(archivo);

  const registros =
    filas
      .slice(1)
      .filter((fila) =>
        fila.some(
          (celda) =>
            limpiarTexto(celda) !== ""
        )
      )
      .map((fila) => {
        const cedula =
          normalizarCedula(fila[6]);

        return {
          fechaSolicitud:
            formatearFecha(fila[4]),
          fechaSolicitudDate:
            parsearFecha(fila[4]),
          correoSolicitante:
            limpiarTexto(fila[2]),
          solicitanteNombre:
            limpiarTexto(fila[3]),
          nombresApellidos:
            limpiarTexto(fila[5]),
          cedula,
          telefono:
            limpiarTexto(fila[7]),
          direccion:
            limpiarTexto(fila[8]),
          municipio:
            limpiarTexto(fila[9]),
          zona:
            limpiarTexto(fila[10]),
          motivoVisita:
            limpiarTexto(fila[11]),
          cargo:
            limpiarTexto(fila[12]),
          fincaEAI:
            limpiarTexto(fila[13]),
          fechaExpedicionCedula:
            formatearFecha(fila[14]),
          fechaVisitaRealizada:
            formatearFecha(fila[15]),
          fechaVisitaDate:
            parsearFecha(fila[15]),
          origenArchivo,
        };
      })
      .filter(
        (registro) =>
          registro.cedula
      );

  await prisma.visitaHistorica.deleteMany({
    where: {
      origenArchivo,
    },
  });

  const tamanoLote =
    500;

  for (
    let i = 0;
    i < registros.length;
    i += tamanoLote
  ) {
    await prisma.visitaHistorica.createMany({
      data:
        registros.slice(
          i,
          i + tamanoLote
        ),
    });
  }

  console.log(
    `Importados ${registros.length} registros de visitas historicas desde ${origenArchivo}`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
