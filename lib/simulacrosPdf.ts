// La versión standalone incorpora las métricas de fuente; la versión Node busca
// archivos .afm que no están disponibles dentro de la función de Vercel.
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { readFileSync } from "node:fs";
import path from "node:path";

type Aspecto = { nombre: string; calificacion: number | string };

function crearPdf(escribir: (doc: PDFKit.PDFDocument) => void) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: MARGEN, size: "LETTER" });
    const fragmentos: Buffer[] = [];
    doc.on("data", (fragmento) => fragmentos.push(Buffer.from(fragmento)));
    doc.on("end", () => resolve(Buffer.concat(fragmentos)));
    doc.on("error", reject);
    try {
      escribir(doc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function titulo(doc: PDFKit.PDFDocument, texto: string) {
  doc.fillColor("#0F3D1F").fontSize(17).font("Helvetica-Bold").text(texto);
  doc.moveDown(0.4).strokeColor("#0F3D1F").moveTo(48, doc.y).lineTo(547, doc.y).stroke();
  doc.moveDown(0.7).fillColor("#111827").font("Helvetica");
}

function bloque(doc: PDFKit.PDFDocument, etiqueta: string, contenido?: string | null) {
  doc.font("Helvetica-Bold").fontSize(10).text(etiqueta);
  doc.font("Helvetica").fontSize(9.5).text(contenido || "No registrado", { lineGap: 2 });
  doc.moveDown(0.65);
}

const MARGEN = 46;
const ANCHO = 520;
let logoPdf: Buffer | null | undefined;

function dibujarLogo(doc: PDFKit.PDFDocument, y: number) {
  if (logoPdf === undefined) {
    try { logoPdf = readFileSync(path.join(process.cwd(), "public", "fflogo-pdf.jpg")); } catch { logoPdf = null; }
  }
  if (logoPdf) {
    try { doc.image(`data:image/jpeg;base64,${logoPdf.toString("base64")}`, MARGEN + 7, y + 12, { fit: [124, 44], align: "center", valign: "center" }); return; } catch { /* Se conserva el texto de respaldo. */ }
  }
  doc.fillColor("#0F3D1F").font("Helvetica-Bold").fontSize(14).text("FALCON FARMS", MARGEN + 17, y + 25, { width: 105, align: "center" });
}

function encabezadoFormato(doc: PDFKit.PDFDocument, pagina: number) {
  const y = 42;
  doc.lineWidth(0.8).strokeColor("#111111").rect(MARGEN, y, ANCHO, 72).stroke();
  doc.moveTo(184, y).lineTo(184, y + 72).stroke();
  doc.moveTo(484, y).lineTo(484, y + 72).stroke();
  doc.moveTo(484, y + 24).lineTo(566, y + 24).stroke();
  doc.moveTo(484, y + 48).lineTo(566, y + 48).stroke();
  dibujarLogo(doc, y);
  doc.fillColor("#111111").font("Helvetica").fontSize(12).text("FALCON FARMS DE COLOMBIA S.A.", 194, y + 20, { width: 280, align: "center", height: 14 });
  doc.font("Helvetica-Bold").fontSize(12).text("PLANEACIÓN Y EVALUACIÓN DE SIMULACRO", 190, y + 40, { width: 288, align: "center" });
  doc.font("Helvetica").fontSize(8.5).text("Versión 01", 486, y + 7, { width: 78, align: "center" });
  doc.text("Mayo 2019", 486, y + 31, { width: 78, align: "center" });
  doc.text(`Página ${pagina} de 3`, 486, y + 55, { width: 78, align: "center" });
}

function encabezadoSacFormato(doc: PDFKit.PDFDocument, pagina: number) {
  const y = 42;
  doc.lineWidth(0.8).strokeColor("#111111").rect(MARGEN, y, ANCHO, 72).stroke();
  doc.moveTo(184, y).lineTo(184, y + 72).stroke();
  doc.moveTo(484, y).lineTo(484, y + 72).stroke();
  doc.moveTo(484, y + 24).lineTo(566, y + 24).stroke();
  doc.moveTo(484, y + 48).lineTo(566, y + 48).stroke();
  dibujarLogo(doc, y);
  doc.fillColor("#111111").font("Helvetica-Bold").fontSize(13).text("FALCON FARMS DE COLOMBIA S.A.", 190, y + 15, { width: 288, align: "center", height: 16 });
  doc.font("Helvetica-Bold").fontSize(13).text("SOLICITUD DE ACCIÓN", 190, y + 37, { width: 288, align: "center" });
  doc.font("Helvetica").fontSize(10).text("Versión 6", 486, y + 13, { width: 78, align: "center" });
  doc.text("Julio 2026", 486, y + 37, { width: 78, align: "center" });
  doc.fontSize(8).text(`Página ${pagina} de 2`, 486, y + 55, { width: 78, align: "center", height: 10 });
}

function barraFormato(doc: PDFKit.PDFDocument, titulo: string, y: number, centrado = false) {
  doc.fillColor("#050505").rect(MARGEN, y, ANCHO, 19).fill();
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8.5).text(titulo.toUpperCase(), MARGEN + 6, y + 5, { width: ANCHO - 12, height: 10, align: centrado ? "center" : "left" });
  return y + 19;
}

function altoTexto(doc: PDFKit.PDFDocument, texto: string, ancho = ANCHO - 14) {
  doc.font("Helvetica").fontSize(8.6);
  return Math.max(26, Math.ceil(doc.heightOfString(texto || "No registrado", { width: ancho, lineGap: 2 }) + 12));
}

function campoFormato(doc: PDFKit.PDFDocument, etiqueta: string, valor: string | null | undefined, y: number, alto?: number) {
  const contenido = valor || "No registrado";
  const h = alto || altoTexto(doc, contenido);
  doc.strokeColor("#111111").lineWidth(0.6).rect(MARGEN, y, ANCHO, h).stroke();
  doc.fillColor("#111111").font("Helvetica-Bold").fontSize(8.2).text(etiqueta, MARGEN + 6, y + 5, { width: ANCHO - 12, height: 9, lineBreak: false });
  const fuente = h >= 100 ? 7.2 : 8.1;
  doc.font("Helvetica").fontSize(fuente).text(contenido, MARGEN + 6, y + 16, { width: ANCHO - 12, height: Math.max(8, h - 20), lineGap: 1, ellipsis: true });
  return y + h;
}

function filaFormato(doc: PDFKit.PDFDocument, y: number, celdas: Array<{ etiqueta: string; valor: string; ancho: number }>, alto = 39) {
  let x = MARGEN;
  for (const celda of celdas) {
    const filaCompacta = alto <= 24;
    doc.strokeColor("#111111").lineWidth(0.6).rect(x, y, celda.ancho, alto).stroke();
    doc.fillColor("#111111").font("Helvetica-Bold").fontSize(7.4).text(celda.etiqueta, x + 5, y + 4, { width: celda.ancho - 10, height: filaCompacta ? 7 : 10, lineBreak: false });
    doc.font("Helvetica").fontSize(filaCompacta ? 7 : 7.8).text(celda.valor || "—", x + 5, y + (filaCompacta ? 12 : 18), { width: celda.ancho - 10, height: Math.max(7, alto - (filaCompacta ? 14 : 21)), ellipsis: true });
    x += celda.ancho;
  }
  return y + alto;
}

function calificacionVisible(calificacion: number | string) {
  const valor = Number(calificacion);
  if (valor === 3) return "3 - Excelente (1 punto)";
  if (valor === 2) return "2 - Bueno (0,5 puntos)";
  if (valor === 1) return "1 - Deficiente (0 puntos)";
  return String(calificacion || "No calificado");
}

function tablaAccionesFormato(doc: PDFKit.PDFDocument, titulo: string, filas: Array<{ actividad: string; responsable: string; fecha: string }>, y: number) {
  y = barraFormato(doc, titulo, y);
  y = filaFormato(doc, y, [{ etiqueta: "ACTIVIDAD", valor: "", ancho: 265 }, { etiqueta: "RESPONSABLE", valor: "", ancho: 155 }, { etiqueta: "FECHA", valor: "", ancho: 100 }], 20);
  if (!filas.length) return filaFormato(doc, y, [{ etiqueta: "", valor: "Sin registros", ancho: ANCHO }], 28);
  for (const fila of filas) y = filaFormato(doc, y, [{ etiqueta: "", valor: fila.actividad, ancho: 265 }, { etiqueta: "", valor: fila.responsable, ancho: 155 }, { etiqueta: "", valor: fila.fecha, ancho: 100 }], 30);
  return y;
}

async function descargarEvidenciasImagen(evidencias: Array<{ nombre?: string; url?: string }> = []) {
  const resultados: Array<{ nombre: string; contenido: Buffer }> = [];
  for (const evidencia of evidencias.slice(0, 4)) {
    if (!evidencia.url || !/^https?:\/\//i.test(evidencia.url) || !/\.(jpg|jpeg)$/i.test(evidencia.nombre || "")) continue;
    try {
      const respuesta = await fetch(evidencia.url);
      const contenido = Buffer.from(await respuesta.arrayBuffer());
      if (!respuesta.ok || contenido[0] !== 0xff || contenido[1] !== 0xd8) continue;
      resultados.push({ nombre: evidencia.nombre || "Evidencia fotográfica", contenido });
    } catch {
      // La evidencia sigue disponible como enlace en Falcon aunque el proveedor no permita descargarla aquí.
    }
  }
  return resultados;
}

export async function generarPdfSimulacro(datos: {
  id: number; consecutivo?: string | null; tipo: string; finca: string; area?: string | null; grupoObjeto?: string | null; personasInformadas?: string | null; escenario?: string | null; fecha: Date; horaInicio: string; duracionMinutos?: number | null; coordinador: string; analista: string; objetivo: string; riesgo: string; controles: string[]; guion: string; resultado: string; promedioEvaluacion?: number | null; cumplimientoObjetivo: string; desarrollo: string; aspectos: Aspecto[]; conclusion: string; controlVulnerado?: string | null; razonIncumplimiento?: string | null; factoresFalla?: string[] | null; requiereSac: boolean; evidencias?: Array<{ nombre?: string; url?: string }>;
}) {
  const imagenes = await descargarEvidenciasImagen(datos.evidencias);
  return crearPdf((doc) => {
    const fecha = datos.fecha.toLocaleDateString("es-CO", { timeZone: "America/Bogota", day: "2-digit", month: "2-digit", year: "numeric" });
    let y = 126;
    encabezadoFormato(doc, 1);
    let paginaSimulacro = 1;
    doc.on("pageAdded", () => encabezadoFormato(doc, ++paginaSimulacro));
    y = filaFormato(doc, y, [
      { etiqueta: "SIMULACRO No.", valor: datos.consecutivo || `SIM-${datos.id}`, ancho: 173 },
      { etiqueta: "FECHA PREVISTA EJECUCIÓN", valor: fecha, ancho: 173 },
      { etiqueta: "HORA PREVISTA", valor: datos.horaInicio, ancho: 174 },
    ]);
    y = filaFormato(doc, y, [
      { etiqueta: "EAI / EIC", valor: datos.finca, ancho: 173 },
      { etiqueta: "OSV", valor: "DEPARTAMENTO DE SEGURIDAD", ancho: 173 },
      { etiqueta: "FECHA PLANEACIÓN", valor: fecha, ancho: 174 },
    ]);
    y = campoFormato(doc, "GRUPO OBJETO DEL SIMULACRO", datos.grupoObjeto || `Personal de ${datos.finca}`, y);
    y = campoFormato(doc, "COORDINADOR DEL SIMULACRO", datos.coordinador, y, 30);
    y = barraFormato(doc, "CARGOS Y PERSONAS INFORMADAS", y);
    y = campoFormato(doc, "", datos.personasInformadas || `${datos.analista} - ANALISTA SIG`, y);
    y = campoFormato(doc, "OBJETIVO", datos.objetivo, y);
    y = campoFormato(doc, "RIESGO", datos.riesgo, y);
    y = barraFormato(doc, "CONTROLES DE SEGURIDAD A EVALUAR", y);
    y = campoFormato(doc, "", datos.controles.join(" · "), y);
    y = campoFormato(doc, "ESCENARIO", datos.escenario || datos.area || "No registrado", y);
    y = barraFormato(doc, "DESCRIPCIÓN DEL GUION", y);
    y = campoFormato(doc, "", datos.guion, y);
    y = campoFormato(doc, "TIEMPO ESTIMADO DEL EJERCICIO", datos.duracionMinutos ? `${datos.duracionMinutos} minutos` : "No registrado", y, 30);

    doc.addPage({ margin: MARGEN, size: "LETTER" });
    y = 126;
    y = barraFormato(doc, "RESULTADOS Y EVALUACIÓN DEL SIMULACRO", y);
    y = filaFormato(doc, y, [{ etiqueta: "FECHA DE EVALUACIÓN", valor: fecha, ancho: ANCHO }], 32);
    y = campoFormato(doc, "RESULTADO DEL SIMULACRO", datos.resultado, y, 31);
    y = campoFormato(doc, "CUMPLIMIENTO DEL OBJETIVO", datos.cumplimientoObjetivo, y);
    y = barraFormato(doc, "DESARROLLO DEL SIMULACRO", y);
    y = campoFormato(doc, "", datos.desarrollo, y, Math.min(165, altoTexto(doc, datos.desarrollo)));
    y = barraFormato(doc, "ASPECTOS PARA EVALUAR", y);
    doc.fillColor("#111111").font("Helvetica-Oblique").fontSize(7.8).text("Calificación: Excelente = 1 punto · Bueno = 0,5 puntos · Deficiente = 0 puntos", MARGEN + 4, y + 4, { width: ANCHO - 8 });
    y += 19;
    for (const aspecto of datos.aspectos) {
      y = filaFormato(doc, y, [
        { etiqueta: aspecto.nombre.toUpperCase(), valor: "", ancho: 360 },
        { etiqueta: "CALIFICACIÓN", valor: calificacionVisible(aspecto.calificacion), ancho: 160 },
      ], 22);
    }
    const puntos: Record<number, number> = { 3: 1, 2: 0.5, 1: 0 };
    const calificaciones = datos.aspectos.map((aspecto) => Number(aspecto.calificacion)).filter((calificacion) => Object.hasOwn(puntos, calificacion));
    const promedioCalculado = calificaciones.length ? calificaciones.reduce((total, calificacion) => total + puntos[calificacion], 0) / calificaciones.length : null;
    const promedio = promedioCalculado == null ? "No calculado" : `${promedioCalculado.toFixed(2)} / 1 (${Math.round(promedioCalculado * 100)}%)`;
    y = campoFormato(doc, "PROMEDIO DE EVALUACIÓN", promedio, y, 30);
    y = barraFormato(doc, "CONCLUSIÓN GENERAL DEL SIMULACRO", y);
    y = campoFormato(doc, "", datos.conclusion, y, Math.min(45, altoTexto(doc, datos.conclusion)));
    y = campoFormato(doc, "CONTROL VULNERADO / RAZÓN DEL INCUMPLIMIENTO", [datos.controlVulnerado, datos.razonIncumplimiento, datos.factoresFalla?.join(", ")].filter(Boolean).join(". ") || "No aplica", y);
    y = campoFormato(doc, "REQUIERE GENERAR SAC O SAP", datos.requiereSac ? "SÍ. Debe gestionar la solicitud de acción correctiva asociada." : "NO", y, 32);
    y = barraFormato(doc, "RESPONSABLE(S) DE LA EVALUACIÓN", y);
    y = filaFormato(doc, y, [
      { etiqueta: "NOMBRE", valor: datos.coordinador, ancho: 260 },
      { etiqueta: "CARGO", valor: "SUPERVISOR DE SEGURIDAD", ancho: 260 },
    ], 42);

    doc.removeAllListeners("pageAdded");
    doc.addPage({ margin: MARGEN, size: "LETTER" });
    encabezadoFormato(doc, 3);
    y = 126;
    y = barraFormato(doc, "REGISTRO FOTOGRÁFICO", y, true);
    const archivos = datos.evidencias || [];
    if (imagenes.length) {
      const espacio = 10;
      const anchoFoto = imagenes.length === 1 ? ANCHO - 16 : (ANCHO - 24) / 2;
      const altoFoto = imagenes.length === 1 ? 560 : 300;
      for (const [indice, imagen] of imagenes.entries()) {
        const columna = imagenes.length === 1 ? 0 : indice % 2;
        const fila = imagenes.length === 1 ? 0 : Math.floor(indice / 2);
        const x = MARGEN + 8 + columna * (anchoFoto + espacio);
        const fotoY = y + 8 + fila * (altoFoto + 30);
        doc.strokeColor("#111111").lineWidth(0.6).rect(x - 2, fotoY - 2, anchoFoto + 4, altoFoto + 4).stroke();
        try {
          doc.image(`data:image/jpeg;base64,${imagen.contenido.toString("base64")}`, x, fotoY, { fit: [anchoFoto, altoFoto], align: "center", valign: "center" });
        } catch {
          doc.fillColor("#4b5563").font("Helvetica").fontSize(9).text("No fue posible incrustar esta imagen.", x + 12, fotoY + 20, { width: anchoFoto - 24, align: "center" });
        }
        doc.fillColor("#111111").font("Helvetica").fontSize(7.5).text(imagen.nombre, x, fotoY + altoFoto + 7, { width: anchoFoto, align: "center" });
      }
    } else if (!archivos.length) {
      campoFormato(doc, "EVIDENCIAS", "No se registraron archivos de evidencia.", y, 55);
    } else {
      for (const [indice, archivo] of archivos.entries()) {
        y = campoFormato(doc, `EVIDENCIA ${indice + 1}`, archivo.nombre || "Archivo adjunto", y, 45);
      }
      doc.fillColor("#4b5563").font("Helvetica-Oblique").fontSize(8).text("Las evidencias se conservan asociadas al simulacro dentro de Falcon Service Desk.", MARGEN, y + 12, { width: ANCHO });
    }
  });
}

export async function generarPdfSac(datos: {
  consecutivo: string; finca: string; tipoAccion: string; proceso: string; sistemaGestion: string; norma?: string | null; requisito?: string | null; responsableProceso?: string | null; descripcionSituacion: string; correccion?: string | null; correcciones?: Array<{ actividad: string; responsable: string; fecha: string }> | null; analisisCausa: string; factoresCausa: string[]; planAccion: Array<{ actividad: string; responsable: string; fecha: string }>; seguimiento?: Array<{ fecha: string; comentario: string; realizadoPor: string }> | null; eficacia?: boolean | null; seCierra?: boolean | null; comentariosCierre?: string | null; analistaNombre: string; analisisRealizadoCargo?: string | null;
}) {
  return crearPdf((doc) => {
    let y = 126;
    encabezadoSacFormato(doc, 1);
    let paginaSac = 1;
    doc.on("pageAdded", () => encabezadoSacFormato(doc, ++paginaSac));
    y = filaFormato(doc, y, [{ etiqueta: "TIPO DE ACCIÓN", valor: "CORRECTIVA", ancho: 173 }, { etiqueta: "CONSECUTIVO", valor: datos.consecutivo, ancho: 173 }, { etiqueta: "FINCA", valor: datos.finca, ancho: 174 }]);
    y = filaFormato(doc, y, [{ etiqueta: "RESPONSABLE", valor: datos.responsableProceso || datos.analistaNombre, ancho: 173 }, { etiqueta: "PROCESO", valor: datos.proceso, ancho: 173 }, { etiqueta: "SISTEMA DE GESTIÓN", valor: datos.sistemaGestion, ancho: 174 }]);
    y = filaFormato(doc, y, [{ etiqueta: "NORMA", valor: datos.norma || "—", ancho: 260 }, { etiqueta: "REQUISITO", valor: datos.requisito || "—", ancho: 260 }]);
    y = barraFormato(doc, "1. DESCRIPCIÓN DE LA SITUACIÓN (HALLAZGO + EVIDENCIA OBJETIVA)", y);
    y = campoFormato(doc, "", datos.descripcionSituacion, y, Math.min(115, altoTexto(doc, datos.descripcionSituacion)));
    y = tablaAccionesFormato(doc, "2. CORRECCIÓN (SI APLICA)", datos.correcciones || [], y);
    y = barraFormato(doc, "3. ANÁLISIS DE CAUSA RAÍZ", y);
    y = campoFormato(doc, "", datos.analisisCausa, y, Math.min(100, altoTexto(doc, datos.analisisCausa)));
    y = campoFormato(doc, "FACTORES IDENTIFICADOS", datos.factoresCausa.join(" · ") || "No registrado", y, 33);
    y = filaFormato(doc, y, [{ etiqueta: "ANÁLISIS REALIZADO POR", valor: datos.analistaNombre, ancho: 260 }, { etiqueta: "CARGO", valor: datos.analisisRealizadoCargo || "ANALISTA SIG", ancho: 260 }], 38);

    doc.addPage({ margin: MARGEN, size: "LETTER" });
    y = 126;
    y = tablaAccionesFormato(doc, "4. PLAN DE ACCIÓN FRENTE A LA CAUSA RAÍZ", datos.planAccion, y);
    const seguimiento = (datos.seguimiento || []).map((item) => `${item.fecha}: ${item.comentario} (${item.realizadoPor})`).join("\n");
    y = barraFormato(doc, "5. SEGUIMIENTO", y);
    y = campoFormato(doc, "FECHA / COMENTARIOS / REALIZADO POR", seguimiento || datos.comentariosCierre || "Sin registros", y, Math.min(150, altoTexto(doc, seguimiento || datos.comentariosCierre || "Sin registros")));
    y = barraFormato(doc, "6. EVALUACIÓN DE LA EFICACIA", y);
    y = filaFormato(doc, y, [{ etiqueta: "LAS ACCIONES EMPRENDIDAS FUERON EFICACES", valor: datos.eficacia ? "SÍ" : "NO", ancho: 360 }, { etiqueta: "LA SAC SE CIERRA", valor: datos.seCierra ? "SÍ" : "NO", ancho: 160 }], 42);
    y = campoFormato(doc, "COMENTARIOS DE CIERRE", datos.comentariosCierre || "Sin comentarios", y, Math.min(95, altoTexto(doc, datos.comentariosCierre || "Sin comentarios")));
    y = barraFormato(doc, "7. RESPONSABLE DEL CIERRE", y);
    y = filaFormato(doc, y, [{ etiqueta: "RESPONSABLE SIG", valor: datos.analistaNombre, ancho: 260 }, { etiqueta: "CARGO", valor: datos.analisisRealizadoCargo || "ANALISTA SIG", ancho: 260 }], 42);
    doc.fillColor("#4b5563").font("Helvetica-Oblique").fontSize(8).text("Las evidencias de cierre quedan disponibles en Falcon Service Desk y no se incrustan en este PDF.", MARGEN, y + 16, { width: ANCHO });
  });
}
