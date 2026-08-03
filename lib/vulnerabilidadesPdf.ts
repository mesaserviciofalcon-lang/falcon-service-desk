import PDFDocument
from "pdfkit/js/pdfkit.standalone";

import fs
from "fs";

import path
from "path";

type Foto = {
  url: string;
  nombre: string;
  tipo?: string;
};

type DatosPdf = {
  id: number;
  consecutivo?: string | null;
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
  analistaSigNombre?: string | null;
  gerenteNombre?: string | null;
  fotos: Foto[];
};

function fechaCompletaBogota(
  fecha: Date
) {
  return fecha.toLocaleString(
    "es-CO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone:
        "America/Bogota",
    }
  );
}

function escribirBloque(
  doc: PDFKit.PDFDocument,
  titulo: string,
  valor?: string | null,
  alto = 95
) {
  if (!valor) {
    return;
  }

  if (doc.y + alto > 760) {
    doc.addPage();
  }

  const x = 48;
  const ancho = 499;
  const y = doc.y;

  doc
    .rect(x, y, ancho, 16)
    .fill("#000000");

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(titulo.toUpperCase(), x, y + 3, {
      width: ancho,
      align: "center",
    });

  doc
    .rect(x, y + 16, ancho, alto)
    .stroke("#111111");

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#111827")
    .text(valor, x + 8, y + 26, {
      width: ancho - 16,
      height: alto - 12,
      align: "justify",
    });

  doc.y = y + alto + 28;
}

function dibujarEncabezado(
  doc: PDFKit.PDFDocument
) {
  const x = 48;
  const y = 42;
  const ancho = 499;
  const alto = 42;
  const logoAncho = 150;
  const infoAncho = 94;

  doc
    .rect(x, y, ancho, alto)
    .stroke("#111111");
  doc
    .moveTo(x + logoAncho, y)
    .lineTo(x + logoAncho, y + alto)
    .stroke();
  doc
    .moveTo(x + ancho - infoAncho, y)
    .lineTo(x + ancho - infoAncho, y + alto)
    .stroke();

  const logoPath =
    path.join(
      process.cwd(),
      "public",
      "logo-falcon.png"
    );

  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, x + 30, y + 5, {
      fit: [86, 30],
    });
  } else {
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#0F3D1F")
      .text("FALCON FARMS", x + 20, y + 14, {
        width: 110,
        align: "center",
      });
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#111111")
    .text(
      "FALCON FARMS DE COLOMBIA S.A.",
      x + logoAncho,
      y + 9,
      {
        width:
          ancho - logoAncho - infoAncho,
        align: "center",
      }
    )
    .fontSize(9)
    .text(
      "ANALISIS DE VULNERABILIDAD",
      x + logoAncho,
      y + 24,
      {
        width:
          ancho - logoAncho - infoAncho,
        align: "center",
      }
    );

  doc
    .font("Helvetica")
    .fontSize(8)
    .text("Version 2", x + ancho - infoAncho, y + 5, {
      width: infoAncho,
      align: "center",
    })
    .text("Abril 2024", x + ancho - infoAncho, y + 18, {
      width: infoAncho,
      align: "center",
    })
    .text("Pagina 1", x + ancho - infoAncho, y + 31, {
      width: infoAncho,
      align: "center",
    });
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

  dibujarEncabezado(doc);

  doc.y = 100;
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#111111")
    .text(
      `Consecutivo: ${datos.consecutivo || `#${datos.id}`}`
    )
    .text(
      `${fechaCompletaBogota(datos.fecha)}`
    )
    .text(
      `Senores: ${datos.gerenteNombre || datos.eai}`
    )
    .text(
      `Ante: ${datos.analistaSigNombre || "Analista SIG"}`
    )
    .moveDown(3);

  doc
    .font("Helvetica")
    .fontSize(10)
    .text(
      `Asunto: Analisis de vulnerabilidad referente a: ${datos.actoInseguro}`
    )
    .moveDown(0.4);

  escribirBloque(
    doc,
    "Vulnerabilidad",
    datos.vulnerabilidad,
    120
  );

  escribirBloque(
    doc,
    "Plan de accion",
    datos.planAccionSugerido,
    95
  );

  escribirBloque(
    doc,
    "Informacion del reporte",
    [
      `Finca / EAI: ${datos.eai}`,
      `Reportado por: ${datos.reportadoPor || datos.supervisor}`,
      `Supervisor: ${datos.supervisor}`,
      `Estado: ${datos.estado}`,
    ].join("\n"),
    70
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
