export const actosInsegurosVulnerabilidad = [
  "BARRERAS ESTRUCTURALES",
  "BARRERAS PERIMETRALES",
  "EQUIPOS SIN DISPOSITIVOS DE SEGURIDAD",
  "FALLAS CCTV",
  "FALTA DE ILUMINACION",
  "OBJETO O MATERIAL ABANDONADO",
  "PUERTAS, VENTANAS Y CANDADOS SIN ASEGURAR",
  "OTROS",
];

export const procesosVulnerabilidad = [
  "GESTION HUMANA",
  "MANTENIMIENTO",
  "MIPE",
  "MIRFE",
  "POSTCOSECHA",
  "PRODUCCION",
];

export const estadosVulnerabilidad = [
  "ABIERTO",
  "CERRADO",
];

type ContactoVulnerabilidad = {
  eai: string;
  correo: string;
  nombre: string;
  cargo: "ANALISTA SIG" | "GERENTE";
};

const contactosVulnerabilidad: ContactoVulnerabilidad[] = [
  {
    eai: "IB-ISABELITA",
    correo: "alejandra.bonett@falconfarms.com.co",
    nombre: "Alejandra Bonett",
    cargo: "ANALISTA SIG",
  },
  {
    eai: "IB-ISABELITA",
    correo: "franklin.torresc@falconfarms.com.co",
    nombre: "Franklin Torres",
    cargo: "GERENTE",
  },
  {
    eai: "I4-ISABELITA",
    correo: "alejandra.bonett@falconfarms.com.co",
    nombre: "Alejandra Bonett",
    cargo: "ANALISTA SIG",
  },
  {
    eai: "I4-ISABELITA",
    correo: "franklin.torresc@falconfarms.com.co",
    nombre: "Franklin Torres",
    cargo: "GERENTE",
  },
  {
    eai: "LV-LA VIRGINIA",
    correo: "fabio.vera@falconfarms.com.co",
    nombre: "Fabio Vera",
    cargo: "ANALISTA SIG",
  },
  {
    eai: "LV-LA VIRGINIA",
    correo: "jhon.munoz@falconfarms.com.co",
    nombre: "Jhon Munoz",
    cargo: "GERENTE",
  },
  {
    eai: "AJ-ALEJANDRA",
    correo: "nidia.salamanca@falconfarms.com.co",
    nombre: "Nidia Salamanca",
    cargo: "ANALISTA SIG",
  },
  {
    eai: "AJ-ALEJANDRA",
    correo: "fernando.sanabria@falconfarms.com.co",
    nombre: "Fernando Sanabria",
    cargo: "GERENTE",
  },
  {
    eai: "P0-PALO ALTO",
    correo: "dilan.gutierrez@falconfarms.com.co",
    nombre: "Dilan Gutierrez",
    cargo: "ANALISTA SIG",
  },
  {
    eai: "P0-PALO ALTO",
    correo: "gustavo.velasquez@falconfarms.com.co",
    nombre: "Gustavo Velasquez",
    cargo: "GERENTE",
  },
  {
    eai: "SZ-SANTA CRUZ",
    correo: "carmen.bonilla@falconfarms.com.co",
    nombre: "Carmen Bonilla",
    cargo: "ANALISTA SIG",
  },
  {
    eai: "SZ-SANTA CRUZ",
    correo: "german.gonzalez@falconfarms.com.co",
    nombre: "German Gonzalez",
    cargo: "GERENTE",
  },
  {
    eai: "AB-ARBOLES",
    correo: "carmen.bonilla@falconfarms.com.co",
    nombre: "Carmen Bonilla",
    cargo: "ANALISTA SIG",
  },
  {
    eai: "AB-ARBOLES",
    correo: "german.gonzalez@falconfarms.com.co",
    nombre: "German Gonzalez",
    cargo: "GERENTE",
  },
  {
    eai: "LN-LA NINA DE MIS OJOS",
    correo: "samuel.guzman@falconfarms.com.co",
    nombre: "Samuel Guzman",
    cargo: "ANALISTA SIG",
  },
  {
    eai: "LN-LA NINA DE MIS OJOS",
    correo: "abdrubal.mendoza@falconfarms.com.co",
    nombre: "Abdrubal Mendoza",
    cargo: "GERENTE",
  },
  {
    eai: "TM-TORREMOLINOS",
    correo: "edgar.garciaa@falconfarms.com.co",
    nombre: "Edgar Garciaa",
    cargo: "ANALISTA SIG",
  },
  {
    eai: "TM-TORREMOLINOS",
    correo: "gilberto.uzgame@falconfarms.com.co",
    nombre: "Gilberto Uzgame",
    cargo: "GERENTE",
  },
  {
    eai: "LC-LA CAROLINA",
    correo: "ghumana@agricolalacarolina.com",
    nombre: "Manuela Alayon",
    cargo: "ANALISTA SIG",
  },
  {
    eai: "LC-LA CAROLINA",
    correo: "javierrengifo9@hotmail.com",
    nombre: "Javier Rengifo",
    cargo: "GERENTE",
  },
];

export function codigoEai(
  eai: string
) {
  return eai
    .split("-")[0]
    .trim()
    .toUpperCase();
}

export function formatearFechaVulnerabilidad(
  fecha: Date | string
) {
  return new Date(fecha)
    .toLocaleDateString(
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

export function formatearReferenciaVulnerabilidad({
  consecutivo,
  eai,
  fecha,
  id,
}: {
  consecutivo?: string | null;
  eai: string;
  fecha: Date | string;
  id?: number;
}) {
  const base =
    consecutivo ||
    `${codigoEai(eai)} #${id || ""}`.trim();

  return `${base} - ${formatearFechaVulnerabilidad(fecha)}`;
}

export async function generarConsecutivoVulnerabilidad({
  prisma,
  eai,
  fecha,
}: {
  prisma: {
    vulnerabilidadInforme: {
      count: (args: any) => Promise<number>;
    };
  };
  eai: string;
  fecha: Date;
}) {
  const codigo =
    codigoEai(eai);
  const inicioAnio =
    new Date(
      fecha.getFullYear(),
      0,
      1
    );
  const inicioSiguienteAnio =
    new Date(
      fecha.getFullYear() + 1,
      0,
      1
    );
  const totalAnio =
    await prisma
      .vulnerabilidadInforme
      .count({
        where: {
          eai: {
            startsWith:
              codigo,
          },
          fecha: {
            gte:
              inicioAnio,
            lt:
              inicioSiguienteAnio,
          },
        },
      });
  const anio =
    String(
      fecha.getFullYear()
    ).slice(-2);
  const secuencia =
    String(totalAnio + 1)
      .padStart(2, "0");

  return `${codigo} ${anio}${secuencia}`;
}

function normalizarEai(
  eai: string
) {
  return eai
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function normalizarCorreos(
  valor?: string | null
) {
  return (valor || "")
    .split(/[;,]/)
    .map((correo) =>
      correo.trim()
    )
    .filter(Boolean);
}

export function obtenerDestinatariosVulnerabilidad(
  eai: string
) {
  const codigo =
    codigoEai(eai);

  const configuracion =
    process.env
      .VULNERABILIDAD_CORREOS_POR_EAI;

  if (configuracion) {
    try {
      const mapa =
        JSON.parse(configuracion) as Record<
          string,
          string[] | string
        >;

      const destinatarios =
        mapa[codigo] ||
        mapa[eai] ||
        mapa.DEFAULT;

      if (Array.isArray(destinatarios)) {
        return destinatarios.filter(Boolean);
      }

      return normalizarCorreos(
        destinatarios
      );
    } catch (error) {
      console.error(
        "No se pudo leer VULNERABILIDAD_CORREOS_POR_EAI",
        error
      );
    }
  }

  return normalizarCorreos(
    process.env
      .VULNERABILIDAD_CORREOS_DEFAULT
  );
}

export function obtenerContactosVulnerabilidad(
  eai: string
) {
  const codigo =
    codigoEai(eai);
  const normalizado =
    normalizarEai(eai);

  const contactos =
    contactosVulnerabilidad.filter(
      (contacto) =>
        codigoEai(contacto.eai) ===
          codigo ||
        normalizarEai(contacto.eai) ===
          normalizado
    );

  return {
    analista:
      contactos.find(
        (contacto) =>
          contacto.cargo ===
          "ANALISTA SIG"
      ) || null,
    gerente:
      contactos.find(
        (contacto) =>
          contacto.cargo ===
          "GERENTE"
      ) || null,
  };
}

export function obtenerCopiasVulnerabilidad() {
  const configuradas =
    normalizarCorreos(
      process.env
        .VULNERABILIDAD_CORREOS_COPIA
    );

  if (configuradas.length > 0) {
    return configuradas;
  }

  return [
    "juan.rojas@falconfarms.com.co",
    "luis.charry@falconfarms.com.co",
  ];
}

export function vulnerabilidadCorreoTemplate({
  id,
  referencia,
  eai,
  actoInseguro,
  reportadoPor,
}: {
  id: number;
  referencia?: string;
  eai: string;
  actoInseguro: string;
  reportadoPor: string;
}) {
  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5">
      <h2 style="color:#0F3D1F">Analisis de vulnerabilidad ${referencia || `#${id}`}</h2>
      <p>Buen dia,</p>
      <p>
        Se remite informe de analisis de vulnerabilidad correspondiente a la finca
        <strong>${eai}</strong>.
      </p>
      <p>
        <strong>Acto inseguro:</strong> ${actoInseguro}
      </p>
      <p>
        El informe completo se encuentra adjunto en formato PDF para su revision
        y gestion correspondiente.
      </p>
      <p>
        <strong>Reportado por:</strong> ${reportadoPor}
      </p>
      <hr />
      <p style="font-size:12px;color:#64748b">
        Falcon Service Desk - Security Department
      </p>
    </div>
  `;
}

export function recordatorioVulnerabilidadesTemplate({
  analista,
  informes,
}: {
  analista?: string | null;
  informes: Array<{
    id: number;
    consecutivo?: string | null;
    eai: string;
    fecha: Date | string;
    actoInseguro: string;
    vulnerabilidad: string;
    supervisor: string;
  }>;
}) {
  const filas =
    informes.map((informe) => `
      <tr>
        <td style="border:1px solid #d1d5db;padding:8px">
          ${formatearReferenciaVulnerabilidad(informe)}
        </td>
        <td style="border:1px solid #d1d5db;padding:8px">${informe.eai}</td>
        <td style="border:1px solid #d1d5db;padding:8px">${informe.actoInseguro}</td>
        <td style="border:1px solid #d1d5db;padding:8px">${informe.supervisor}</td>
        <td style="border:1px solid #d1d5db;padding:8px">${informe.vulnerabilidad}</td>
      </tr>
    `).join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5">
      <h2 style="color:#0F3D1F">Analisis de vulnerabilidad pendientes por cerrar</h2>
      <p>Buen dia${analista ? `, ${analista}` : ""}.</p>
      <p>
        Se relacionan los analisis de vulnerabilidad que llevan mas de 8 dias
        abiertos y aun se encuentran pendientes de cierre.
      </p>
      <table style="border-collapse:collapse;width:100%;font-size:13px">
        <thead>
          <tr style="background:#0F3D1F;color:#ffffff">
            <th style="border:1px solid #0F3D1F;padding:8px;text-align:left">Consecutivo</th>
            <th style="border:1px solid #0F3D1F;padding:8px;text-align:left">EAI</th>
            <th style="border:1px solid #0F3D1F;padding:8px;text-align:left">Acto inseguro</th>
            <th style="border:1px solid #0F3D1F;padding:8px;text-align:left">Reportado por</th>
            <th style="border:1px solid #0F3D1F;padding:8px;text-align:left">Vulnerabilidad</th>
          </tr>
        </thead>
        <tbody>
          ${filas}
        </tbody>
      </table>
      <p>
        Por favor ingresar a Falcon Service Desk para realizar el cierre y cargar
        la evidencia correspondiente.
      </p>
      <hr />
      <p style="font-size:12px;color:#64748b">
        Falcon Service Desk - Security Department
      </p>
    </div>
  `;
}

export function cierreVulnerabilidadCorreoTemplate({
  referencia,
  eai,
  actoInseguro,
  cerradoPor,
  fechaCierre,
}: {
  referencia: string;
  eai: string;
  actoInseguro: string;
  cerradoPor: string;
  fechaCierre: Date | string;
}) {
  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5">
      <h2 style="color:#0F3D1F">Cierre de analisis de vulnerabilidad</h2>
      <p>Buen dia,</p>
      <p>
        Se informa que el analisis de vulnerabilidad
        <strong>${referencia}</strong> fue cerrado correctamente.
      </p>
      <p>
        <strong>Finca / EAI:</strong> ${eai}<br />
        <strong>Acto inseguro:</strong> ${actoInseguro}<br />
        <strong>Cerrado por:</strong> ${cerradoPor}<br />
        <strong>Fecha de cierre:</strong> ${formatearFechaVulnerabilidad(fechaCierre)}
      </p>
      <p>
        Esta es una notificacion automatica de cierre. No requiere ingresar al sitio.
      </p>
      <hr />
      <p style="font-size:12px;color:#64748b">
        Falcon Service Desk - Security Department
      </p>
    </div>
  `;
}
