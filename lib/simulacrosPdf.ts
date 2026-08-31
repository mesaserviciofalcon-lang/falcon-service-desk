import PDFDocument from "pdfkit";

type Aspecto = { nombre: string; calificacion: number | string };

function crearPdf(escribir: (doc: PDFKit.PDFDocument) => void) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const fragmentos: Buffer[] = [];
    doc.on("data", (fragmento) => fragmentos.push(Buffer.from(fragmento)));
    doc.on("end", () => resolve(Buffer.concat(fragmentos)));
    doc.on("error", reject);
    escribir(doc);
    doc.end();
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

export async function generarPdfSimulacro(datos: {
  id: number; tipo: string; finca: string; area?: string | null; fecha: Date; horaInicio: string; coordinador: string; analista: string; objetivo: string; riesgo: string; controles: string[]; guion: string; resultado: string; cumplimientoObjetivo: string; desarrollo: string; aspectos: Aspecto[]; conclusion: string; controlVulnerado?: string | null; razonIncumplimiento?: string | null; factoresFalla?: string[] | null; requiereSac: boolean;
}) {
  return crearPdf((doc) => {
    titulo(doc, "INFORME DE SIMULACRO");
    doc.fontSize(9.5).text(`Simulacro #${datos.id} | Fecha de ejecución: ${datos.fecha.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })} | Hora de inicio: ${datos.horaInicio}`);
    doc.moveDown();
    bloque(doc, "Tipo de simulacro", datos.tipo);
    bloque(doc, "Finca / EAI", datos.finca);
    bloque(doc, "Área", datos.area);
    bloque(doc, "Coordinador", datos.coordinador);
    bloque(doc, "Analista SIG coordinado", datos.analista);
    bloque(doc, "Objetivo", datos.objetivo);
    bloque(doc, "Riesgo a evaluar", datos.riesgo);
    bloque(doc, "Controles a evaluar", datos.controles.join("; "));
    bloque(doc, "Guion", datos.guion);
    bloque(doc, "Resultado", datos.resultado);
    bloque(doc, "Cumplimiento del objetivo", datos.cumplimientoObjetivo);
    bloque(doc, "Desarrollo del simulacro", datos.desarrollo);
    doc.addPage();
    titulo(doc, "RESULTADOS Y EVALUACIÓN");
    doc.font("Helvetica-Bold").fontSize(10).text("Aspectos evaluados (3 excelente, 2 bueno, 1 deficiente)");
    doc.moveDown(0.3);
    for (const aspecto of datos.aspectos) {
      doc.font("Helvetica").fontSize(9.5).text(`${aspecto.nombre}: ${aspecto.calificacion}`);
    }
    doc.moveDown();
    bloque(doc, "Conclusión general", datos.conclusion);
    bloque(doc, "Control vulnerado", datos.controlVulnerado);
    bloque(doc, "Razón del incumplimiento", datos.razonIncumplimiento);
    bloque(doc, "Factores identificados", datos.factoresFalla?.join("; "));
    bloque(doc, "¿Requiere SAC?", datos.requiereSac ? "Sí" : "No");
    doc.moveDown();
    doc.font("Helvetica-Bold").text("Responsable de la evaluación");
    doc.font("Helvetica").text(datos.coordinador);
  });
}

export async function generarPdfSac(datos: {
  consecutivo: string; finca: string; tipoAccion: string; proceso: string; sistemaGestion: string; responsableProceso?: string | null; descripcionSituacion: string; correccion?: string | null; analisisCausa: string; factoresCausa: string[]; planAccion: Array<{ actividad: string; responsable: string; fecha: string }>; seguimiento?: Array<{ fecha: string; comentario: string; realizadoPor: string }> | null; eficacia?: boolean | null; seCierra?: boolean | null; comentariosCierre?: string | null; analistaNombre: string;
}) {
  return crearPdf((doc) => {
    titulo(doc, "SOLICITUD DE ACCIÓN");
    doc.fontSize(9.5).text(`Consecutivo: ${datos.consecutivo} | Finca: ${datos.finca}`);
    doc.moveDown();
    bloque(doc, "Tipo de acción", datos.tipoAccion);
    bloque(doc, "Proceso", datos.proceso);
    bloque(doc, "Sistema de gestión", datos.sistemaGestion);
    bloque(doc, "Responsable del proceso", datos.responsableProceso);
    bloque(doc, "1. Descripción de la situación", datos.descripcionSituacion);
    bloque(doc, "2. Corrección", datos.correccion);
    bloque(doc, "3. Análisis de causa raíz", datos.analisisCausa);
    bloque(doc, "Factores de causa", datos.factoresCausa.join("; "));
    doc.addPage();
    titulo(doc, "PLAN DE ACCIÓN Y CIERRE");
    doc.font("Helvetica-Bold").fontSize(10).text("4. Plan de acción");
    doc.moveDown(0.3);
    for (const item of datos.planAccion) doc.font("Helvetica").fontSize(9.5).text(`${item.actividad} | Responsable: ${item.responsable} | Fecha: ${item.fecha}`);
    doc.moveDown();
    bloque(doc, "5. Seguimiento", datos.seguimiento?.map((item) => `${item.fecha}: ${item.comentario} (${item.realizadoPor})`).join("\n"));
    bloque(doc, "6. Evaluación de eficacia", datos.eficacia == null ? "Pendiente" : datos.eficacia ? "Sí" : "No");
    bloque(doc, "La SAC se cierra", datos.seCierra == null ? "Pendiente" : datos.seCierra ? "Sí" : "No");
    bloque(doc, "Comentarios de cierre", datos.comentariosCierre);
    bloque(doc, "Responsable SIG", datos.analistaNombre);
  });
}
