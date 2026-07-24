import * as XLSX
from "xlsx";

import {
  encabezadosAntecedentesHistorico,
  encabezadosAntecedentesSolicitud,
  nombreHojaAntecedentes,
  nombrePlantillaAntecedentes,
} from "@/lib/antecedentesPlantilla";

import { obtenerFechaActualColombiaISO }
from "@/lib/fecha";

type RegistroAntecedenteExcel = {
  fechaSolicitud?: string;
  fechaRespuesta?: string;
  eai?: string;
  nombresApellidos?: string;
  tipoDocumento?: string;
  identificacion: string;
  fechaExpedicionDocumento?: string;
  observacion?: string;
  revisadoPor?: string;
  motivo?: string;
  autorizacion?: string;
  observaciones?: string;
};

function normalizarTexto(
  valor: string
) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function normalizarEncabezadoExacto(
  valor: string
) {
  return valor
    .trim()
    .toUpperCase();
}

function limpiarValor(
  valor: unknown
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  if (valor instanceof Date) {
    return valor
      .toISOString()
      .slice(0, 10);
  }

  return String(valor).trim();
}

function obtenerValor(
  fila: Record<string, unknown>,
  encabezadoBuscado: string
) {
  const entrada =
    Object.entries(fila).find(
      ([encabezado]) =>
        normalizarTexto(encabezado) ===
        encabezadoBuscado
    );

  return limpiarValor(
    entrada?.[1]
  );
}

function normalizarDocumento(
  valor: string
) {
  return valor
    .replace(/\D/g, "")
    .trim();
}

function validarIdentificacionesDuplicadas(
  filas: Record<string, unknown>[]
) {
  const vistos =
    new Map<string, number>();

  filas.forEach((fila, index) => {
    const documento =
      normalizarDocumento(
        obtenerValor(
          fila,
          "IDENTIFICACION"
        )
      );

    if (!documento) {
      return;
    }

    const numeroFila =
      index + 2;

    const filaOriginal =
      vistos.get(documento);

    if (filaOriginal) {
      throw new Error(
        `No fue posible cargar este archivo. La fila ${numeroFila} tiene el número de documento ${documento} duplicado. También aparece en la fila ${filaOriginal}. Debe eliminar el registro repetido.`
      );
    }

    vistos.set(
      documento,
      numeroFila
    );
  });
}

function validarFilasCompletasSolicitud(
  filas: Record<string, unknown>[]
) {
  const camposObligatorios = [
    "FECHA DE SOLICITUD",
    "EAI",
    "NOMBRES Y APELLIDOS",
    "TIPO DE DOCUMENTO",
    "IDENTIFICACION",
    "FECHA EXPEDICION DOCUMENTO",
  ];

  filas.forEach((fila, index) => {
    const tieneDatos =
      Object.values(fila).some(
        (valor) =>
          limpiarValor(valor) !== ""
      );

    if (!tieneDatos) {
      return;
    }

    const campoFaltante =
      camposObligatorios.find(
        (campo) =>
          !obtenerValor(
            fila,
            campo
          )
      );

    if (campoFaltante) {
      throw new Error(
        `No fue posible cargar este archivo. La fila ${index + 2} tiene incompleto el campo "${campoFaltante}". Debe diligenciar todos los campos obligatorios antes de guardar el ticket.`
      );
    }
  });
}

function obtenerEncabezados(
  sheet: XLSX.WorkSheet
) {
  const range =
    sheet["!ref"]
      ? XLSX.utils.decode_range(
          sheet["!ref"]
        )
      : null;

  if (!range) {
    return [];
  }

  const encabezados: string[] = [];

  for (
    let columna = range.s.c;
    columna <= range.e.c;
    columna++
  ) {
    const celda =
      sheet[
        XLSX.utils.encode_cell({
          r: range.s.r,
          c: columna,
        })
      ];

    encabezados.push(
      limpiarValor(celda?.v)
    );
  }

  return encabezados;
}

function validarEncabezados(
  sheet: XLSX.WorkSheet,
  requeridos: string[]
) {
  const encabezados =
    obtenerEncabezados(sheet);

  const faltantes =
    requeridos.filter((encabezado) => {
      const indice =
        requeridos.indexOf(encabezado);

      return (
        normalizarEncabezadoExacto(
          encabezados[indice] || ""
        ) !==
        normalizarEncabezadoExacto(
          encabezado
        )
      );
    });

  if (faltantes.length > 0) {
    const encabezado =
      faltantes[0];

    const indice =
      requeridos.indexOf(encabezado);

    const letraColumna =
      XLSX.utils.encode_col(indice);

    const valorActual =
      encabezados[indice] || "vacía";

    throw new Error(
      `El Excel no tiene el formato correcto. La columna ${letraColumna} debe ser "${encabezado}" y actualmente está como "${valorActual}".`
    );
  }

  const extras =
    encabezados.slice(requeridos.length)
      .filter(Boolean);

  if (extras.length > 0) {
    const letraColumna =
      XLSX.utils.encode_col(
        requeridos.length
      );

    throw new Error(
      `El Excel no tiene el formato correcto. La columna ${letraColumna} no debe existir. Elimine columnas adicionales después de "${requeridos[requeridos.length - 1]}".`
    );
  }
}

function validarNombreArchivo(
  nombreArchivo: string | undefined
) {
  if (
    nombreArchivo &&
    nombreArchivo !==
      nombrePlantillaAntecedentes
  ) {
    throw new Error(
      `El archivo debe llamarse "${nombrePlantillaAntecedentes}". Actualmente se llama "${nombreArchivo}".`
    );
  }
}

async function leerFilasDesdeUrl(
  url: string,
  requeridos: string[],
  nombreArchivo?: string,
  validarFilasSolicitud = false
) {
  validarNombreArchivo(nombreArchivo);

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      "No se pudo leer el Excel de antecedentes"
    );
  }

  const buffer =
    await response.arrayBuffer();

  const workbook =
    XLSX.read(buffer, {
      type: "array",
      cellDates: true,
    });

  const sheetName =
    workbook.SheetNames[0];

  if (
    sheetName !== nombreHojaAntecedentes
  ) {
    throw new Error(
      `El nombre de la hoja debe ser "${nombreHojaAntecedentes}". Actualmente es "${sheetName || "sin hoja"}".`
    );
  }

  const sheet =
    workbook.Sheets[sheetName];

  if (!sheet) {
    return [];
  }

  validarEncabezados(
    sheet,
    requeridos
  );

  const filas =
    XLSX.utils.sheet_to_json<
      Record<string, unknown>
    >(sheet, {
      defval: "",
    });

  validarIdentificacionesDuplicadas(
    filas
  );

  if (validarFilasSolicitud) {
    validarFilasCompletasSolicitud(
      filas
    );
  }

  return filas;
}

function mapearRegistros(
  filas: Record<string, unknown>[],
  usarFechaRespuestaActual = false
) {
  const fechaRespuestaActual =
    obtenerFechaActualColombiaISO();

  return filas
    .map((fila) => ({
      fechaSolicitud:
        obtenerValor(
          fila,
          "FECHA DE SOLICITUD"
        ),
      fechaRespuesta:
        usarFechaRespuestaActual
          ? fechaRespuestaActual
          : obtenerValor(
              fila,
              "FECHA RESPUESTA"
            ),
      eai:
        obtenerValor(fila, "EAI"),
      nombresApellidos:
        obtenerValor(
          fila,
          "NOMBRES Y APELLIDOS"
        ),
      tipoDocumento:
        obtenerValor(
          fila,
          "TIPO DE DOCUMENTO"
        ),
      identificacion:
        obtenerValor(
          fila,
          "IDENTIFICACION"
        ),
      fechaExpedicionDocumento:
        obtenerValor(
          fila,
          "FECHA EXPEDICION DOCUMENTO"
        ),
      observacion:
        obtenerValor(
          fila,
          "OBSERVACION"
        ),
      revisadoPor:
        obtenerValor(
          fila,
          "REVISADO POR"
        ),
      motivo:
        obtenerValor(
          fila,
          "MOTIVO"
        ),
      autorizacion:
        obtenerValor(
          fila,
          "AUTORIZACION"
        ),
      observaciones:
        obtenerValor(
          fila,
          "OBSERVACIONES"
        ),
    }))
    .filter(
      (fila) =>
        fila.identificacion ||
        fila.nombresApellidos
    )
    .map((fila) => ({
      ...fila,
      identificacion:
        fila.identificacion || "SIN IDENTIFICACION",
    }));
}

export async function leerRegistrosAntecedentesDesdeUrl(
  url: string,
  nombreArchivo?: string
): Promise<RegistroAntecedenteExcel[]> {
  const filas =
    await leerFilasDesdeUrl(
      url,
      encabezadosAntecedentesSolicitud,
      nombreArchivo,
      true
    );

  return mapearRegistros(
    filas,
    true
  );
}

export async function leerRegistrosAntecedentesHistoricoDesdeUrl(
  url: string,
  nombreArchivo?: string
): Promise<RegistroAntecedenteExcel[]> {
  const filas =
    await leerFilasDesdeUrl(
      url,
      encabezadosAntecedentesHistorico,
      nombreArchivo
    );

  return mapearRegistros(filas);
}
