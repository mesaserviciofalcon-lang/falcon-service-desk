import { readFileSync }
from "fs";

import { join }
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

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X = 48;
const TOP_Y = 780;
const BOTTOM_Y = 70;
const LOGO_WIDTH = 200;
const LOGO_HEIGHT = 100;
let logoPdfActivo = false;

function obtenerLogoPdf() {
  try {
    return readFileSync(
      join(
        process.cwd(),
        "public",
        "fflogo-pdf.jpg"
      )
    );
  } catch {
    return null;
  }
}

function limpiarTexto(valor?: string | number | null) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\n]/g, "")
    .trim();
}

function escaparPdf(valor: string) {
  return limpiarTexto(valor)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function fechaCompletaBogota(fecha: Date) {
  return fecha.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });
}

function envolverTexto(texto: string, maxCaracteres: number) {
  const lineas: string[] = [];

  for (const parrafo of limpiarTexto(texto).split("\n")) {
    const palabras = parrafo.split(/\s+/).filter(Boolean);
    let linea = "";

    for (const palabra of palabras) {
      const candidata = linea ? `${linea} ${palabra}` : palabra;

      if (candidata.length > maxCaracteres && linea) {
        lineas.push(linea);
        linea = palabra;
      } else {
        linea = candidata;
      }
    }

    if (linea) {
      lineas.push(linea);
    }
  }

  return lineas.length ? lineas : [""];
}

function textoPdf(
  x: number,
  y: number,
  texto: string,
  size = 10,
  fuente = "F1"
) {
  return `BT /${fuente} ${size} Tf ${x} ${y} Td (${escaparPdf(texto)}) Tj ET\n`;
}

function rectPdf(
  x: number,
  y: number,
  w: number,
  h: number,
  opciones: {
    fill?: string;
    stroke?: string;
  } = {}
) {
  const comandos: string[] = [];

  if (opciones.fill) {
    comandos.push(`${opciones.fill} rg`);
  }

  if (opciones.stroke) {
    comandos.push(`${opciones.stroke} RG`);
  }

  comandos.push(`${x} ${y} ${w} ${h} re`);
  comandos.push(opciones.fill ? "f" : "S");

  return `${comandos.join("\n")}\n`;
}

function colorRgb(hex: string) {
  const limpio = hex.replace("#", "");
  const r = parseInt(limpio.slice(0, 2), 16) / 255;
  const g = parseInt(limpio.slice(2, 4), 16) / 255;
  const b = parseInt(limpio.slice(4, 6), 16) / 255;

  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

function crearPagina(conLogo = logoPdfActivo) {
  const comandos: string[] = [];

  comandos.push("0 0 0 RG\n0.2 w\n");
  comandos.push(rectPdf(48, 770, 499, 42, {
    stroke: colorRgb("111111"),
  }));
  comandos.push("198 770 m 198 812 l S\n453 770 m 453 812 l S\n");

  if (conLogo) {
    comandos.push("q\n132 0 0 36 57 773 cm\n/ImLogo Do\nQ\n");
  } else {
    comandos.push(textoPdf(78, 792, "FALCON FARMS", 10, "F2"));
  }

  comandos.push(textoPdf(223, 794, "FALCON FARMS DE COLOMBIA S.A.", 10, "F2"));
  comandos.push(textoPdf(247, 779, "ANALISIS DE VULNERABILIDAD", 9, "F2"));
  comandos.push(textoPdf(480, 798, "Version 2", 8));
  comandos.push(textoPdf(480, 785, "Abril 2024", 8));

  return comandos;
}

function agregarParrafo(
  paginas: string[][],
  cursor: {
    y: number;
  },
  texto: string,
  opciones: {
    size?: number;
    fuente?: string;
    maxCaracteres?: number;
    salto?: number;
  } = {}
) {
  const size = opciones.size || 10;
  const salto = opciones.salto || size + 4;
  const lineas = envolverTexto(
    texto,
    opciones.maxCaracteres || 88
  );

  for (const linea of lineas) {
    if (cursor.y < BOTTOM_Y) {
      paginas.push(crearPagina());
      cursor.y = TOP_Y - 70;
    }

    paginas[paginas.length - 1].push(
      textoPdf(MARGIN_X, cursor.y, linea, size, opciones.fuente || "F1")
    );
    cursor.y -= salto;
  }
}

function agregarBloque(
  paginas: string[][],
  cursor: {
    y: number;
  },
  titulo: string,
  valor?: string | null
) {
  if (!valor) {
    return;
  }

  const lineas = envolverTexto(valor, 82);
  const alto = Math.max(70, lineas.length * 13 + 34);

  if (cursor.y - alto < BOTTOM_Y) {
    paginas.push(crearPagina());
    cursor.y = TOP_Y - 70;
  }

  const yCaja = cursor.y - alto;
  const pagina = paginas[paginas.length - 1];

  pagina.push(rectPdf(MARGIN_X, cursor.y - 16, 499, 16, {
    fill: colorRgb("000000"),
  }));
  pagina.push("1 1 1 rg\n");
  pagina.push(textoPdf(MARGIN_X + 190, cursor.y - 12, titulo.toUpperCase(), 10, "F2"));
  pagina.push("0 0 0 rg\n");
  pagina.push(rectPdf(MARGIN_X, yCaja, 499, alto - 16, {
    stroke: colorRgb("111111"),
  }));

  let yTexto = cursor.y - 34;

  for (const linea of lineas) {
    pagina.push(textoPdf(MARGIN_X + 10, yTexto, linea, 10));
    yTexto -= 13;
  }

  cursor.y = yCaja - 26;
}

export async function generarPdfVulnerabilidad(datos: DatosPdf) {
  const logo =
    obtenerLogoPdf();
  logoPdfActivo =
    Boolean(logo);
  const paginas = [
    crearPagina(),
  ];
  const cursor = {
    y: 735,
  };
  const referencia = datos.consecutivo || `#${datos.id}`;

  agregarParrafo(paginas, cursor, `Consecutivo: ${referencia}`);
  agregarParrafo(paginas, cursor, fechaCompletaBogota(datos.fecha));
  agregarParrafo(paginas, cursor, `Senores: ${datos.gerenteNombre || datos.eai}`);
  agregarParrafo(paginas, cursor, `Ante: ${datos.analistaSigNombre || "Analista SIG"}`);

  cursor.y -= 35;
  agregarParrafo(
    paginas,
    cursor,
    `Asunto: Analisis de vulnerabilidad referente a: ${datos.actoInseguro}`,
    {
      maxCaracteres: 80,
    }
  );
  cursor.y -= 6;

  agregarBloque(paginas, cursor, "Vulnerabilidad", datos.vulnerabilidad);
  agregarBloque(paginas, cursor, "Plan de accion", datos.planAccionSugerido);
  agregarBloque(
    paginas,
    cursor,
    "Informacion del reporte",
    [
      `Finca / EAI: ${datos.eai}`,
      `Reportado por: ${datos.reportadoPor || datos.supervisor}`,
      `Estado: ${datos.estado}`,
      datos.fotos.length
        ? `Evidencias adjuntas en plataforma: ${datos.fotos.length}`
        : "",
    ]
      .filter(Boolean)
      .join("\n")
  );

  paginas.forEach((pagina, index) => {
    pagina.push(
      textoPdf(
        472,
        772,
        `Pagina ${index + 1} de ${paginas.length}`,
        8
      )
    );
  });

  const objetos: string[] = [];
  const pageObjectIds: number[] = [];
  const contentObjectIds: number[] = [];

  objetos.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  objetos.push("__PAGES__");
  objetos.push(
    "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj"
  );
  objetos.push(
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj"
  );

  let nextId = 5;
  const logoObjectId =
    logo ? nextId++ : null;

  if (logo && logoObjectId) {
    objetos.push(
      `${logoObjectId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${LOGO_WIDTH} /Height ${LOGO_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.length} >>\nstream\n${logo.toString("latin1")}\nendstream\nendobj`
    );
  }

  for (const pagina of paginas) {
    const pageId = nextId++;
    const contentId = nextId++;
    const contenido = pagina.join("");

    pageObjectIds.push(pageId);
    contentObjectIds.push(contentId);
    objetos.push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> ${
        logoObjectId
          ? `/XObject << /ImLogo ${logoObjectId} 0 R >>`
          : ""
      } >> /Contents ${contentId} 0 R >>\nendobj`
    );
    objetos.push(
      `${contentId} 0 obj\n<< /Length ${Buffer.byteLength(contenido, "latin1")} >>\nstream\n${contenido}endstream\nendobj`
    );
  }

  objetos[1] =
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjectIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] /Count ${pageObjectIds.length} >>\nendobj`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const objeto of objetos) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${objeto}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "latin1");

  pdf += `xref\n0 ${objetos.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}
