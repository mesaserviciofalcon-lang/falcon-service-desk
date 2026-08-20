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

import {
  eaiOpciones,
  obtenerErrorIdentificacion,
  tipoDocumentoOpciones,
} from "@/lib/antecedentesCatalogos";

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
    return formatearISO(
      valor.getFullYear(),
      valor.getMonth() + 1,
      valor.getDate()
    );
  }

  return String(valor).trim();
}

function obtenerLetraColumna(
  indice: number
) {
  return XLSX.utils.encode_col(
    indice
  );
}

function obtenerCelda(
  sheet: XLSX.WorkSheet,
  fila: number,
  columna: number
) {
  return sheet[
    XLSX.utils.encode_cell({
      r: fila,
      c: columna,
    })
  ];
}

function valorCelda(
  celda: XLSX.CellObject | undefined
) {
  return limpiarValor(celda?.v);
}

function celdaTieneValor(
  celda: XLSX.CellObject | undefined
) {
  return valorCelda(celda) !== "";
}

function celdaEsFechaValida(
  celda: XLSX.CellObject | undefined
) {
  return Boolean(
    obtenerFechaCeldaISO(celda)
  );
}

function formatearISO(
  anio: number,
  mes: number,
  dia: number
) {
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function obtenerFechaCeldaISO(
  celda: XLSX.CellObject | undefined
) {
  if (!celdaTieneValor(celda)) {
    return "";
  }

  if (celda?.v instanceof Date) {
    if (
      Number.isNaN(
        celda.v.getTime()
      )
    ) {
      return "";
    }

    return formatearISO(
      celda.v.getFullYear(),
      celda.v.getMonth() + 1,
      celda.v.getDate()
    );
  }

  if (typeof celda?.v === "number") {
    const fechaExcel =
      XLSX.SSF.parse_date_code(celda.v);

    if (
      !fechaExcel ||
      fechaExcel.y < 1900 ||
      fechaExcel.y > 2100
    ) {
      return "";
    }

    return formatearISO(
      fechaExcel.y,
      fechaExcel.m,
      fechaExcel.d
    );
  }

  return "";
}

function formatearFechaMensaje(
  fechaISO: string
) {
  const partes =
    fechaISO.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!partes) {
    return fechaISO;
  }

  return `${partes[3]}/${partes[2]}/${partes[1]}`;
}

function lanzarErrorCelda(
  fila: number,
  columna: number,
  mensaje: string
) {
  throw new Error(
    `No fue posible cargar este archivo. Fila ${fila}, columna ${obtenerLetraColumna(columna)}: ${mensaje}`
  );
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

function validarTipoDatosSolicitud(
  sheet: XLSX.WorkSheet,
  requeridos: string[]
) {
  const range =
    sheet["!ref"]
      ? XLSX.utils.decode_range(
          sheet["!ref"]
        )
      : null;

  if (!range) {
    return;
  }

  const indiceFechaSolicitud =
    requeridos.indexOf(
      "FECHA DE SOLICITUD"
    );
  const indiceFechaRespuesta =
    requeridos.indexOf(
      "FECHA RESPUESTA"
    );
  const indiceEai =
    requeridos.indexOf("EAI");
  const indiceNombres =
    requeridos.indexOf(
      "NOMBRES Y APELLIDOS"
    );
  const indiceTipoDocumento =
    requeridos.indexOf(
      "TIPO DE DOCUMENTO"
    );
  const indiceIdentificacion =
    requeridos.findIndex(
      (encabezado) =>
        normalizarTexto(encabezado) ===
        "IDENTIFICACION"
    );
  const indiceFechaExpedicion =
    requeridos.indexOf(
      "FECHA EXPEDICION DOCUMENTO"
    );

  for (
    let fila = range.s.r + 1;
    fila <= range.e.r;
    fila++
  ) {
    const numeroFila =
      fila + 1;

    const celdasFila =
      requeridos.map((_, columna) =>
        obtenerCelda(
          sheet,
          fila,
          columna
        )
      );

    const tieneDatos =
      celdasFila.some(
        celdaTieneValor
      );

    if (!tieneDatos) {
      continue;
    }

    const fechaSolicitud =
      obtenerCelda(
        sheet,
        fila,
        indiceFechaSolicitud
      );

    if (
      !celdaEsFechaValida(
        fechaSolicitud
      )
    ) {
      lanzarErrorCelda(
        numeroFila,
        indiceFechaSolicitud,
        "FECHA DE SOLICITUD debe ser una fecha valida de Excel, no texto."
      );
    }

    const fechaSolicitudISO =
      obtenerFechaCeldaISO(
        fechaSolicitud
      );

    const fechaHoy =
      obtenerFechaActualColombiaISO();

    if (
      fechaSolicitudISO !==
      fechaHoy
    ) {
      lanzarErrorCelda(
        numeroFila,
        indiceFechaSolicitud,
        `FECHA DE SOLICITUD no puede ser mayor ni menor a la fecha en curso (${formatearFechaMensaje(fechaHoy)}). Actualmente esta como ${formatearFechaMensaje(fechaSolicitudISO)}.`
      );
    }

    const fechaRespuesta =
      obtenerCelda(
        sheet,
        fila,
        indiceFechaRespuesta
      );

    if (
      celdaTieneValor(
        fechaRespuesta
      ) &&
      !celdaEsFechaValida(
        fechaRespuesta
      )
    ) {
      lanzarErrorCelda(
        numeroFila,
        indiceFechaRespuesta,
        "FECHA RESPUESTA debe estar vacia o ser una fecha valida de Excel."
      );
    }

    const eai =
      valorCelda(
        obtenerCelda(
          sheet,
          fila,
          indiceEai
        )
      ).toUpperCase();

    if (
      !eaiOpciones.includes(eai)
    ) {
      lanzarErrorCelda(
        numeroFila,
        indiceEai,
        `EAI debe ser uno de estos valores: ${eaiOpciones.join(", ")}.`
      );
    }

    const nombres =
      valorCelda(
        obtenerCelda(
          sheet,
          fila,
          indiceNombres
        )
      );

    if (
      /\d/.test(nombres)
    ) {
      lanzarErrorCelda(
        numeroFila,
        indiceNombres,
        "NOMBRES Y APELLIDOS debe contener texto, no numeros."
      );
    }

    const tipoDocumento =
      valorCelda(
        obtenerCelda(
          sheet,
          fila,
          indiceTipoDocumento
        )
      ).toUpperCase();

    if (
      !tipoDocumentoOpciones.includes(
        tipoDocumento
      )
    ) {
      lanzarErrorCelda(
        numeroFila,
        indiceTipoDocumento,
        `TIPO DE DOCUMENTO debe ser uno de estos valores: ${tipoDocumentoOpciones.join(", ")}.`
      );
    }

    const identificacion =
      valorCelda(
        obtenerCelda(
          sheet,
          fila,
          indiceIdentificacion
        )
      );

    const errorIdentificacion =
      obtenerErrorIdentificacion(
        tipoDocumento,
        identificacion
      );

    if (errorIdentificacion) {
      lanzarErrorCelda(
        numeroFila,
        indiceIdentificacion,
        errorIdentificacion
      );
    }

    const fechaExpedicion =
      obtenerCelda(
        sheet,
        fila,
        indiceFechaExpedicion
      );

    if (
      !celdaEsFechaValida(
        fechaExpedicion
      )
    ) {
      lanzarErrorCelda(
        numeroFila,
        indiceFechaExpedicion,
        "FECHA EXPEDICION DOCUMENTO debe ser una fecha valida de Excel, no texto."
      );
    }
  }
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

  if (validarFilasSolicitud) {
    validarTipoDatosSolicitud(
      sheet,
      requeridos
    );
  }

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
