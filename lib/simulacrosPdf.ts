// La versión standalone incorpora las métricas de fuente; la versión Node busca
// archivos .afm que no están disponibles dentro de la función de Vercel.
import PDFDocument from "pdfkit/js/pdfkit.standalone";

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
  id: number; consecutivo?: string | null; tipo: string; finca: string; area?: string | null; grupoObjeto?: string | null; personasInformadas?: string | null; escenario?: string | null; fecha: Date; horaInicio: string; duracionMinutos?: number | null; coordinador: string; analista: string; objetivo: string; riesgo: string; controles: string[]; guion: string; resultado: string; promedioEvaluacion?: number | null; cumplimientoObjetivo: string; desarrollo: string; aspectos: Aspecto[]; conclusion: string; controlVulnerado?: string | null; razonIncumplimiento?: string | null; factoresFalla?: string[] | null; requiereSac: boolean;
}) {
  return crearPdf((doc) => {
    titulo(doc, "SIMULACRO");
    doc.fontSize(9.5).text(`SIMULACRO No.: ${datos.consecutivo || `SIM-${datos.id}`} | Fecha prevista de ejecución: ${datos.fecha.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })} | Hora prevista: ${datos.horaInicio}`);
    doc.moveDown();
    bloque(doc, "EAI/EIC", datos.finca);
    bloque(doc, "OSV", "Departamento de Seguridad Falcon Farms");
    bloque(doc, "Grupo objeto del simulacro", datos.grupoObjeto || `Personal de la finca ${datos.finca}`);
    bloque(doc, "Tipo de simulacro", datos.tipo);
    bloque(doc, "Coordinador", datos.coordinador);
    bloque(doc, "Cargos y personas informadas", datos.personasInformadas || datos.analista);
    bloque(doc, "Objetivo", datos.objetivo);
    bloque(doc, "Riesgo a evaluar", datos.riesgo);
    bloque(doc, "Controles a evaluar", datos.controles.join("; "));
    bloque(doc, "Escenario", datos.escenario || datos.area);
    bloque(doc, "Descripción del guion", datos.guion);
    bloque(doc, "Tiempo estimado del ejercicio", datos.duracionMinutos ? `${datos.duracionMinutos} minutos` : null);
    bloque(doc, "Resultado", datos.resultado);
    bloque(doc, "Cumplimiento del objetivo", datos.cumplimientoObjetivo);
    bloque(doc, "Desarrollo del simulacro", datos.desarrollo);
    doc.addPage();
    titulo(doc, "RESULTADOS Y EVALUACIÓN DEL SIMULACRO");
    doc.font("Helvetica-Bold").fontSize(10).text("Aspectos evaluados (excelente: 1 punto, bueno: 0,5 puntos, deficiente: 0 puntos)");
    doc.moveDown(0.3);
    for (const aspecto of datos.aspectos) {
      doc.font("Helvetica").fontSize(9.5).text(`${aspecto.nombre}: ${aspecto.calificacion}`);
    }
    if (datos.promedioEvaluacion != null) doc.font("Helvetica-Bold").fontSize(10).text(`Promedio de evaluación: ${datos.promedioEvaluacion.toFixed(2)} / 1 (${Math.round(datos.promedioEvaluacion * 100)}%)`);
    doc.moveDown();
    bloque(doc, "Conclusión general", datos.conclusion);
    bloque(doc, "Control vulnerado", datos.controlVulnerado);
    bloque(doc, "Razón del incumplimiento", datos.razonIncumplimiento);
    bloque(doc, "Factores identificados", datos.factoresFalla?.join("; "));
    bloque(doc, "Requiere generar SAC o SAP", datos.requiereSac ? `Sí. ${datos.razonIncumplimiento || "Revisar la acción correctiva asociada."}` : "No");
    doc.moveDown();
    doc.font("Helvetica-Bold").text("RESPONSABLE(S) DE LA EVALUACIÓN");
    doc.font("Helvetica").text(`${datos.coordinador} | Supervisor de Seguridad`);
  });
}

export async function generarPdfSac(datos: {
  consecutivo: string; finca: string; tipoAccion: string; proceso: string; sistemaGestion: string; norma?: string | null; requisito?: string | null; responsableProceso?: string | null; descripcionSituacion: string; correccion?: string | null; correcciones?: Array<{ actividad: string; responsable: string; fecha: string }> | null; analisisCausa: string; factoresCausa: string[]; planAccion: Array<{ actividad: string; responsable: string; fecha: string }>; seguimiento?: Array<{ fecha: string; comentario: string; realizadoPor: string }> | null; eficacia?: boolean | null; seCierra?: boolean | null; comentariosCierre?: string | null; analistaNombre: string; analisisRealizadoCargo?: string | null;
}) {
  return crearPdf((doc) => {
    titulo(doc, "SOLICITUD DE ACCIÓN");
    doc.fontSize(9.5).text(`Consecutivo: ${datos.consecutivo} | Finca: ${datos.finca}`);
    doc.moveDown();
    bloque(doc, "Tipo de acción", datos.tipoAccion);
    bloque(doc, "Proceso", datos.proceso);
    bloque(doc, "Sistema de gestión", datos.sistemaGestion);
    bloque(doc, "Norma", datos.norma);
    bloque(doc, "Requisito", datos.requisito);
    bloque(doc, "Responsable del proceso", datos.responsableProceso);
    bloque(doc, "1. Descripción de la situación", datos.descripcionSituacion);
    doc.font("Helvetica-Bold").fontSize(10).text("2. CORRECCIÓN (si aplica)");
    doc.moveDown(0.3);
    for (const item of datos.correcciones || []) doc.font("Helvetica").fontSize(9.5).text(`${item.actividad} | Responsable: ${item.responsable} | Fecha: ${item.fecha}`);
    if (!datos.correcciones?.length) bloque(doc, "Corrección", datos.correccion);
    bloque(doc, "3. Análisis de causa raíz", datos.analisisCausa);
    bloque(doc, "Factores de causa", datos.factoresCausa.join("; "));
    bloque(doc, "Análisis realizado por", `${datos.analistaNombre}${datos.analisisRealizadoCargo ? ` (${datos.analisisRealizadoCargo})` : ""}`);
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
