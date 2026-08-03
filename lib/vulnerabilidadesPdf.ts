import PDFDocument
from "pdfkit";

type Foto = {
  url: string;
  nombre: string;
  tipo?: string;
};

type DatosPdf = {
  id: number;
  eai: string;
  fecha: Date;
  actoInseguro: string;
  vulnerabilidad: string;
  planAccionSugerido: string;
  causaRaiz?: string | null;
  proceso?: string | null;
  planAccionEai?: string | null;
  responsables?: string | null;
  fechaEjecucion?: string | null;
  estado: string;
  supervisor: string;
  reportadoPor?: string | null;
  fotos: Foto[];
};

function escribirCampo(
  doc: PDFKit.PDFDocument,
  titulo: string,
  valor?: string | null
) {
  if (!valor) {
    return;
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#0F3D1F")
    .text(titulo);

  doc
    .moveDown(0.2)
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#111827")
    .text(valor, {
      align: "justify",
    })
    .moveDown(0.8);
}

async function obtenerImagen(
  foto: Foto
) {
  try {
    if (
      !foto.tipo?.includes("image") &&
      !foto.nombre.match(
        /\.(jpg|jpeg|png)$/i
      )
    ) {
      return null;
    }

    const response =
      await fetch(foto.url);

    if (!response.ok) {
      return null;
    }

    return Buffer.from(
      await response.arrayBuffer()
    );
  } catch {
    return null;
  }
}

export async function generarPdfVulnerabilidad(
  datos: DatosPdf
) {
  const doc =
    new PDFDocument({
      size: "A4",
      margin: 48,
      info: {
        Title:
          `Analisis de vulnerabilidad ${datos.id}`,
        Author:
          "Falcon Service Desk",
      },
    });

  const chunks: Buffer[] = [];

  doc.on(
    "data",
    (chunk) =>
      chunks.push(chunk)
  );

  const terminado =
    new Promise<Buffer>(
      (resolve, reject) => {
        doc.on("end", () =>
          resolve(
            Buffer.concat(chunks)
          )
        );
        doc.on("error", reject);
      }
    );

  doc
    .rect(0, 0, 595.28, 84)
    .fill("#0F3D1F");

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(18)
    .text(
      "ANALISIS DE VULNERABILIDAD",
      48,
      28
    );

  doc
    .font("Helvetica")
    .fontSize(10)
    .text(
      "Falcon Farms - Departamento de Seguridad",
      48,
      54
    );

  doc
    .moveDown(3)
    .fillColor("#111827");

  escribirCampo(
    doc,
    "Informe",
    `#${datos.id}`
  );
  escribirCampo(
    doc,
    "Finca / EAI",
    datos.eai
  );
  escribirCampo(
    doc,
    "Fecha",
    datos.fecha.toLocaleDateString(
      "es-CO",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone:
          "America/Bogota",
      }
    )
  );
  escribirCampo(
    doc,
    "Acto inseguro",
    datos.actoInseguro
  );
  escribirCampo(
    doc,
    "Vulnerabilidad detectada",
    datos.vulnerabilidad
  );
  escribirCampo(
    doc,
    "Plan de accion sugerido",
    datos.planAccionSugerido
  );
  escribirCampo(
    doc,
    "Causa raiz",
    datos.causaRaiz
  );
  escribirCampo(
    doc,
    "Proceso",
    datos.proceso
  );
  escribirCampo(
    doc,
    "Plan de accion EAI",
    datos.planAccionEai
  );
  escribirCampo(
    doc,
    "Responsables",
    datos.responsables
  );
  escribirCampo(
    doc,
    "Fecha de ejecucion",
    datos.fechaEjecucion
  );
  escribirCampo(
    doc,
    "Estado",
    datos.estado
  );
  escribirCampo(
    doc,
    "Supervisor",
    datos.supervisor
  );
  escribirCampo(
    doc,
    "Reportado por",
    datos.reportadoPor
  );

  if (datos.fotos.length > 0) {
    doc
      .addPage()
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#0F3D1F")
      .text("Registro fotografico")
      .moveDown();

    for (const foto of datos.fotos) {
      const imagen =
        await obtenerImagen(foto);

      if (!imagen) {
        continue;
      }

      if (doc.y > 610) {
        doc.addPage();
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#111827")
        .text(foto.nombre)
        .moveDown(0.4);

      doc.image(imagen, {
        fit: [480, 260],
        align: "center",
      });

      doc.moveDown(1);
    }
  }

  doc.end();

  return terminado;
}
