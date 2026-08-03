export const actosInsegurosVulnerabilidad = [
  "BARRERAS ESTRUCTURALES",
  "BARRERAS PERIMETRALES",
  "CONTROL INGRESO Y SALIDA DE MATERIALES Y EQUIPOS",
  "CONTROL INGRESO Y SALIDA DEL PERSONAL CONTRATISTA",
  "CONTROL INGRESO Y SALIDA DEL PERSONAL DE FINCA",
  "CONTROL INGRESO Y SALIDA PERSONAL VISITANTE",
  "DESPACHO AEROPUERTO",
  "DESPACHO MARITIMO",
  "EQUIPO SIN DISPOSITIVO DE SEGURIDAD",
  "FALTA DE ILUMINACION",
  "OBJETO O MATERIAL ABANDONADO",
  "PUERTAS, VENTANAS Y CANDADOS SIN ASEGURAR",
  "FALLAS CCTV",
  "OTRO",
];

export const procesosVulnerabilidad = [
  "GESTION HUMANA",
  "MANTENIMIENTO",
  "OSV",
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

function codigoEai(
  eai: string
) {
  return eai
    .split("-")[0]
    .trim()
    .toUpperCase();
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
  eai,
  actoInseguro,
  supervisor,
}: {
  id: number;
  eai: string;
  actoInseguro: string;
  supervisor: string;
}) {
  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5">
      <h2 style="color:#0F3D1F">Analisis de vulnerabilidad #${id}</h2>
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
        <strong>Supervisor:</strong> ${supervisor}
      </p>
      <hr />
      <p style="font-size:12px;color:#64748b">
        Falcon Service Desk - Security Department
      </p>
    </div>
  `;
}
