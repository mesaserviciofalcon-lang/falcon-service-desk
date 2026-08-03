import path
from "node:path";

import * as XLSX
from "xlsx";

import { prisma }
from "@/lib/prisma";

import {
  codigoEai,
  generarConsecutivoVulnerabilidad,
} from "@/lib/vulnerabilidades";

type RegistroExcel = {
  eai: string;
  fecha: Date;
  actoInseguro: string;
  vulnerabilidad: string;
  planAccionSugerido: string;
  causaRaiz: string | null;
  proceso: string | null;
  planAccionEai: string | null;
  responsables: string | null;
  fechaEjecucion: string | null;
  estado: string;
  supervisor: string;
};

const archivo =
  process.argv[2] ||
  "C:/Users/crito/Downloads/SEGUIMIENTO ANALISIS DE VULNERABILIDAD (1).xlsx";

function texto(
  valor: unknown
) {
  return String(valor ?? "")
    .trim();
}

function fechaDesdeExcel(
  valor: unknown
) {
  if (valor instanceof Date) {
    return new Date(
      valor.getFullYear(),
      valor.getMonth(),
      valor.getDate(),
      12
    );
  }

  if (typeof valor === "number") {
    const parsed =
      XLSX.SSF.parse_date_code(valor);

    if (parsed) {
      return new Date(
        parsed.y,
        parsed.m - 1,
        parsed.d,
        12
      );
    }
  }

  const limpio =
    texto(valor);

  if (!limpio) {
    return null;
  }

  const fecha =
    new Date(`${limpio} 12:00:00`);

  if (Number.isNaN(fecha.getTime())) {
    return null;
  }

  return fecha;
}

function fechaTexto(
  valor: unknown
) {
  const fecha =
    fechaDesdeExcel(valor);

  if (!fecha) {
    return texto(valor) || null;
  }

  return fecha.toLocaleDateString(
    "es-CO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone:
        "America/Bogota",
    }
  );
}

function estadoNormalizado(
  valor: unknown
) {
  const estado =
    texto(valor).toUpperCase();

  if (estado.includes("CERR")) {
    return "CERRADO";
  }

  return "ABIERTO";
}

function mapearRegistro(
  row: any
): RegistroExcel | null {
  const eai =
    codigoEai(row.EAI || "");
  const fecha =
    fechaDesdeExcel(row.FECHA);
  const actoInseguro =
    texto(row["ACTO INSEGURO"]);
  const vulnerabilidad =
    texto(row.VULNERABILIDAD);
  const planAccionSugerido =
    texto(row["PLAN DE ACCIÓN SUGERIDO"]);

  if (
    !eai ||
    !fecha ||
    !actoInseguro ||
    !vulnerabilidad ||
    !planAccionSugerido
  ) {
    return null;
  }

  return {
    eai,
    fecha,
    actoInseguro,
    vulnerabilidad,
    planAccionSugerido,
    causaRaiz:
      texto(row["CAUSA RAÍZ"]) ||
      null,
    proceso:
      texto(row.PROCESO) ||
      null,
    planAccionEai:
      texto(row["PLAN DE ACCIÓN EAI"]) ||
      null,
    responsables:
      texto(row.RESPONSABLES) ||
      null,
    fechaEjecucion:
      fechaTexto(
        row["FECHA DE EJECUCIÓN"]
      ),
    estado:
      "CERRADO",
    supervisor:
      texto(row.SUPERVISOR) ||
      "HISTORICO",
  };
}

function claveRegistro(
  registro: Pick<
    RegistroExcel,
    | "eai"
    | "fecha"
    | "actoInseguro"
    | "vulnerabilidad"
  >
) {
  return [
    registro.eai,
    registro.fecha
      .toISOString()
      .slice(0, 10),
    registro.actoInseguro,
    registro.vulnerabilidad,
  ].join("|");
}

async function main() {
  const ruta =
    path.resolve(archivo);

  const workbook =
    XLSX.readFile(ruta, {
      cellDates: true,
    });
  const sheet =
    workbook.Sheets.DATA;

  if (!sheet) {
    throw new Error(
      "El archivo no tiene hoja DATA."
    );
  }

  const rows =
    XLSX.utils.sheet_to_json(sheet, {
      defval: null,
      raw: true,
    });

  const registros =
    rows
      .map(mapearRegistro)
      .filter(Boolean) as RegistroExcel[];

  const existentes =
    await prisma
      .vulnerabilidadInforme
      .findMany({
        select: {
          eai: true,
          fecha: true,
          actoInseguro: true,
          vulnerabilidad: true,
        },
      });

  const clavesExistentes =
    new Set(
      existentes.map((item) =>
        claveRegistro(item)
      )
    );

  const nuevos =
    registros.filter(
      (registro) =>
        !clavesExistentes.has(
          claveRegistro(registro)
        )
    );

  let importados =
    0;

  for (const registro of nuevos) {
    const consecutivo =
      await generarConsecutivoVulnerabilidad({
        prisma,
        eai:
          registro.eai,
        fecha:
          registro.fecha,
      });

    await prisma
      .vulnerabilidadInforme
      .create({
        data: {
          ...registro,
          consecutivo,
          correoSupervisor:
            null,
          reportadoPor:
            registro.supervisor,
          fotos: [],
          cierreObservaciones:
            "Importado desde historico",
          cerradoPor:
            "HISTORICO",
          fechaCierre:
            registro.fecha,
        },
      });

    importados += 1;
  }

  console.log({
    archivo: ruta,
    leidos: registros.length,
    existentes:
      registros.length - nuevos.length,
    importados,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
