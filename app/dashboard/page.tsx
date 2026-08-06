import { prisma }
from "@/lib/prisma";

import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import Link
from "next/link";

import NumeroAnimado
from "@/components/NumeroAnimado";

import { formatearFechaColombia }
from "@/lib/fecha";

import { solicitantePuedeVerSolicitud }
from "@/lib/visibilidadSolicitudes";

import { ocultarSolicitudesHistoricas }
from "@/lib/solicitudesHistoricas";

import {
  visibleEnBandejaPorRol,
} from "@/lib/visibilidadTickets";

import {
  esObservacionDocumentoNoCorresponde,
  esObservacionNoTenerEnCuenta,
} from "@/lib/validacionAntecedentesGestion";

const OBSERVACION_CONTINUAR =
  "CONTINUAR CON EL PROCESO";

function normalizarTexto(
  valor?: string | null
) {
  return (valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function esConceptoContinuar(
  observacion?: string | null
) {
  const valor =
    normalizarTexto(observacion);

  return [
    normalizarTexto(
      OBSERVACION_CONTINUAR
    ),
    "CONTINUAR EL PROCESO",
  ].includes(valor);
}

function esConceptoNoTenerEnCuenta(
  observacion?: string | null
) {
  return esObservacionNoTenerEnCuenta(
    observacion
  );
}

function esConceptoDocumentoNoCorresponde(
  observacion?: string | null
) {
  return esObservacionDocumentoNoCorresponde(
    observacion
  );
}

function obtenerFincaTicket(
  ticket: any
) {
  return (
    ticket.cctv?.fincaEAI ||
    ticket.visita?.fincaEAI ||
    ticket.radio?.fincaEAI ||
    ticket.antecedente?.fincaEAI ||
    ticket.novedad?.fincaEAI ||
    "Sin finca"
  );
}

function obtenerMesTicket(
  fecha: Date | string
) {
  return new Date(fecha)
    .toISOString()
    .slice(0, 7);
}

function obtenerMesMetricaTicket(
  ticket: any
) {
  if (
    ticket.estado === "COMPLETADO"
  ) {
    return obtenerMesTicket(
      ticket.fechaCierre ||
      ticket.fechaGestion ||
      ticket.fechaCreacion
    );
  }

  return obtenerMesTicket(
    ticket.fechaCreacion
  );
}

function obtenerWhereDashboardPorRol(
  role?: string
) {
  if (role === "VISITA") {
    return {
      tipo: "VISITA DOMICILIARIA",
    };
  }

  if (role === "SUPERVISOR") {
    return {
      tipo: "ANTECEDENTES",
      asignadoA: "SEGURIDAD",
    };
  }

  if (role === "TECNICO") {
    return {
      tipo: {
        in: [
          "CCTV",
          "RADIOS",
        ],
      },
    };
  }

  if (
    role === "JEFE_SEG" ||
    role === "DIRECTOR_SEG"
  ) {
    return {
      tipo: {
        in: [
          "CCTV",
          "RADIOS",
          "NOVEDAD SEGURIDAD",
        ],
      },
    };
  }

  return {};
}

function obtenerMesAnterior(
  mes: string
) {
  const [
    anio,
    numeroMes,
  ] = mes.split("-");

  const fecha =
    new Date(
      Number(anio),
      Number(numeroMes) - 2,
      1
    );

  return fecha
    .toISOString()
    .slice(0, 7);
}

function obtenerDiaMesColombia() {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Bogota",
        day: "2-digit",
      }
    ).formatToParts(new Date());

  return Number(
    partes.find(
      (parte) =>
        parte.type === "day"
    )?.value || 1
  );
}

function parsearFechaRegistroIndicador(
  valor?: string | null
) {
  if (!valor) {
    return null;
  }

  const texto =
    valor.trim();

  const fecha =
    new Date(texto);

  if (
    !Number.isNaN(
      fecha.getTime()
    )
  ) {
    return fecha;
  }

  const partes =
    texto.match(
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
    );

  if (!partes) {
    return null;
  }

  const fechaLocal =
    new Date(
      Number(partes[3]),
      Number(partes[2]) - 1,
      Number(partes[1])
    );

  return Number.isNaN(
    fechaLocal.getTime()
  )
    ? null
    : fechaLocal;
}

function obtenerFechaRegistroIndicador(
  registro: {
    fechaRespuesta?: string | null;
    fechaSolicitud?: string | null;
    createdAt: Date;
  }
) {
  return (
    parsearFechaRegistroIndicador(
      registro.fechaRespuesta
    ) ||
    parsearFechaRegistroIndicador(
      registro.fechaSolicitud
    ) ||
    registro.createdAt
  );
}

function obtenerMesRegistroIndicador(
  registro: {
    fechaRespuesta?: string | null;
    fechaSolicitud?: string | null;
    createdAt: Date;
  }
) {
  return obtenerFechaRegistroIndicador(
    registro
  )
    .toISOString()
    .slice(0, 7);
}

type MetricasAntecedentes = {
  total: number;
  continuar: number;
  noTenerEnCuenta: number;
  documentoNoCorresponde: number;
  verificacionAnualSinHallazgos: number;
  verificacionAnualConHallazgos: number;
  nacionales: number;
  extranjeros: number;
};

type MetricasVisitas = {
  total: number;
  pendientes: number;
  completadas: number;
  confiables: number;
  noConfiables: number;
  noRealizadas: number;
  sinResultado: number;
  ingreso: number;
  mantenimiento: number;
  sinMotivo: number;
};

type ConteoMes = {
  mes: string;
};

type ConteoVisitasMes = {
  mes: string;
  total: bigint | number;
};

const metricasAntecedentesVacias: MetricasAntecedentes = {
  total: 0,
  continuar: 0,
  noTenerEnCuenta: 0,
  documentoNoCorresponde: 0,
  verificacionAnualSinHallazgos: 0,
  verificacionAnualConHallazgos: 0,
  nacionales: 0,
  extranjeros: 0,
};

const metricasVisitasVacias: MetricasVisitas = {
  total: 0,
  pendientes: 0,
  completadas: 0,
  confiables: 0,
  noConfiables: 0,
  noRealizadas: 0,
  sinResultado: 0,
  ingreso: 0,
  mantenimiento: 0,
  sinMotivo: 0,
};

function normalizarConteo(
  valor: unknown
) {
  return Number(valor || 0);
}

async function obtenerMetricasAntecedentes(
  mes?: string,
  anio?: number
) {
  const resultado =
    await prisma.$queryRaw<
      Array<{
        total: bigint | number;
        continuar: bigint | number;
        no_tener_en_cuenta: bigint | number;
        documento_no_corresponde: bigint | number;
        verificacion_anual_sin_hallazgos: bigint | number;
        verificacion_anual_con_hallazgos: bigint | number;
        nacionales: bigint | number;
        extranjeros: bigint | number;
      }>
    >`
      WITH registros AS (
        SELECT
          "observacion",
          "tipoDocumento",
          COALESCE(
            CASE
              WHEN "fechaRespuesta" ~ '^\\d{4}-\\d{1,2}-\\d{1,2}'
                THEN "fechaRespuesta"::date
              WHEN "fechaRespuesta" ~ '^\\d{1,2}[/-]\\d{1,2}[/-]\\d{4}$'
                THEN to_date(replace("fechaRespuesta", '-', '/'), 'DD/MM/YYYY')
              ELSE NULL
            END,
            CASE
              WHEN "fechaSolicitud" ~ '^\\d{4}-\\d{1,2}-\\d{1,2}'
                THEN "fechaSolicitud"::date
              WHEN "fechaSolicitud" ~ '^\\d{1,2}[/-]\\d{1,2}[/-]\\d{4}$'
                THEN to_date(replace("fechaSolicitud", '-', '/'), 'DD/MM/YYYY')
              ELSE NULL
            END,
            "createdAt"::date
          ) AS fecha_indicador
        FROM "AntecedenteRegistro"
      ),
      filtrados AS (
        SELECT *
        FROM registros
        WHERE
          (${mes || ""} = '' OR to_char(fecha_indicador, 'YYYY-MM') = ${mes || ""})
          AND
          (${anio || 0} = 0 OR EXTRACT(YEAR FROM fecha_indicador)::int = ${anio || 0})
      )
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (
          WHERE upper(trim("observacion")) IN (
            'CONTINUAR CON EL PROCESO',
            'CONTINUAR EL PROCESO'
          )
        ) AS continuar,
        COUNT(*) FILTER (
          WHERE upper(trim("observacion")) = 'LA PERSONA NO DEBE SER TENIDA EN CUENTA'
        ) AS no_tener_en_cuenta,
        COUNT(*) FILTER (
          WHERE
            upper(trim("observacion")) LIKE '%NO CORRESPONDE CON EL NOMBRE%'
            OR upper(trim("observacion")) LIKE '%NO COINCIDE CON EL NOMBRE%'
            OR upper(trim("observacion")) LIKE '%NO COINCIDEN DATOS DEL DOCUMENTO%'
        ) AS documento_no_corresponde,
        COUNT(*) FILTER (
          WHERE upper(trim("observacion")) = 'VERIFICACIÓN ANUAL NO PRESENTA HALLAZGOS'
        ) AS verificacion_anual_sin_hallazgos,
        COUNT(*) FILTER (
          WHERE upper(trim("observacion")) = 'VERIFICACIÓN ANUAL PRESENTA HALLAZGOS'
        ) AS verificacion_anual_con_hallazgos,
        COUNT(*) FILTER (
          WHERE "tipoDocumento" = 'CC'
        ) AS nacionales,
        COUNT(*) FILTER (
          WHERE "tipoDocumento" IN ('PP', 'PPT', 'CE')
        ) AS extranjeros
      FROM filtrados
    `;

  const fila =
    resultado[0];

  if (!fila) {
    return metricasAntecedentesVacias;
  }

  return {
    total:
      normalizarConteo(fila.total),
    continuar:
      normalizarConteo(fila.continuar),
    noTenerEnCuenta:
      normalizarConteo(
        fila.no_tener_en_cuenta
      ),
    documentoNoCorresponde:
      normalizarConteo(
        fila.documento_no_corresponde
      ),
    verificacionAnualSinHallazgos:
      normalizarConteo(
        fila.verificacion_anual_sin_hallazgos
      ),
    verificacionAnualConHallazgos:
      normalizarConteo(
        fila.verificacion_anual_con_hallazgos
      ),
    nacionales:
      normalizarConteo(
        fila.nacionales
      ),
    extranjeros:
      normalizarConteo(
        fila.extranjeros
      ),
  };
}

async function obtenerMesesAntecedentes(
  anio: number
) {
  const resultado =
    await prisma.$queryRaw<ConteoMes[]>`
      WITH registros AS (
        SELECT
          COALESCE(
            CASE
              WHEN "fechaRespuesta" ~ '^\\d{4}-\\d{1,2}-\\d{1,2}'
                THEN "fechaRespuesta"::date
              WHEN "fechaRespuesta" ~ '^\\d{1,2}[/-]\\d{1,2}[/-]\\d{4}$'
                THEN to_date(replace("fechaRespuesta", '-', '/'), 'DD/MM/YYYY')
              ELSE NULL
            END,
            CASE
              WHEN "fechaSolicitud" ~ '^\\d{4}-\\d{1,2}-\\d{1,2}'
                THEN "fechaSolicitud"::date
              WHEN "fechaSolicitud" ~ '^\\d{1,2}[/-]\\d{1,2}[/-]\\d{4}$'
                THEN to_date(replace("fechaSolicitud", '-', '/'), 'DD/MM/YYYY')
              ELSE NULL
            END,
            "createdAt"::date
          ) AS fecha_indicador
        FROM "AntecedenteRegistro"
      )
      SELECT DISTINCT
        to_char(fecha_indicador, 'YYYY-MM') AS mes
      FROM registros
      WHERE EXTRACT(YEAR FROM fecha_indicador)::int = ${anio}
      ORDER BY mes DESC
    `;

  return resultado.map(
    (fila) => fila.mes
  );
}

async function obtenerMetricasVisitas(
  mes: string
) {
  const resultado =
    await prisma.$queryRaw<
      Array<{
        total: bigint | number;
        pendientes: bigint | number;
        completadas: bigint | number;
        confiables: bigint | number;
        no_confiables: bigint | number;
        no_realizadas: bigint | number;
        sin_resultado: bigint | number;
        ingreso: bigint | number;
        mantenimiento: bigint | number;
        sin_motivo: bigint | number;
      }>
    >`
      WITH visitas AS (
        SELECT
          s."estado" AS estado,
          upper(trim(COALESCE(v."resultadoVisita", ''))) AS resultado,
          upper(trim(COALESCE(v."motivoVisita", ''))) AS motivo,
          COALESCE(
            v."fechaRealizada",
            s."fechaGestion",
            s."fechaCierre",
            s."fechaCreacion"
          ) AS fecha_indicador
        FROM "SolicitudVisita" v
        INNER JOIN "Solicitud" s
          ON s."id" = v."solicitudId"
        WHERE s."tipo" = 'VISITA DOMICILIARIA'
        UNION ALL
        SELECT
          'COMPLETADO' AS estado,
          CASE
            WHEN upper(trim(COALESCE(h."fechaVisitaRealizada", ''))) LIKE '%NO%CONFIABLE%'
              THEN 'NO CONFIABLE'
            WHEN upper(trim(COALESCE(h."fechaVisitaRealizada", ''))) LIKE '%CONFIABLE%'
              THEN 'CONFIABLE'
            WHEN h."fechaVisitaDate" IS NOT NULL
              THEN 'CONFIABLE'
            ELSE upper(trim(COALESCE(h."fechaVisitaRealizada", '')))
          END AS resultado,
          upper(trim(COALESCE(h."motivoVisita", ''))) AS motivo,
          COALESCE(
            h."fechaVisitaDate",
            h."fechaSolicitudDate",
            h."createdAt"
          ) AS fecha_indicador
        FROM "VisitaHistorica" h
      )
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (
          WHERE estado <> 'COMPLETADO'
        ) AS pendientes,
        COUNT(*) FILTER (
          WHERE estado = 'COMPLETADO'
        ) AS completadas,
        COUNT(*) FILTER (
          WHERE resultado LIKE '%CONFIABLE%'
            AND resultado NOT LIKE '%NO%CONFIABLE%'
        ) AS confiables,
        COUNT(*) FILTER (
          WHERE resultado LIKE '%NO%CONFIABLE%'
        ) AS no_confiables,
        COUNT(*) FILTER (
          WHERE resultado LIKE '%NO%SE%REALIZO%'
        ) AS no_realizadas,
        COUNT(*) FILTER (
          WHERE estado = 'COMPLETADO'
            AND resultado = ''
        ) AS sin_resultado,
        COUNT(*) FILTER (
          WHERE motivo = 'INGRESO'
            OR motivo LIKE 'INGRESO %'
        ) AS ingreso,
        COUNT(*) FILTER (
          WHERE motivo = 'MANTENIMIENTO'
            OR motivo LIKE 'MANTENIMIENTO %'
        ) AS mantenimiento,
        COUNT(*) FILTER (
          WHERE motivo = ''
            OR (
              motivo <> 'INGRESO'
              AND motivo NOT LIKE 'INGRESO %'
              AND motivo <> 'MANTENIMIENTO'
              AND motivo NOT LIKE 'MANTENIMIENTO %'
            )
        ) AS sin_motivo
      FROM visitas
      WHERE to_char(fecha_indicador, 'YYYY-MM') = ${mes}
    `;

  const fila =
    resultado[0];

  if (!fila) {
    return metricasVisitasVacias;
  }

  return {
    total:
      normalizarConteo(fila.total),
    pendientes:
      normalizarConteo(
        fila.pendientes
      ),
    completadas:
      normalizarConteo(
        fila.completadas
      ),
    confiables:
      normalizarConteo(
        fila.confiables
      ),
    noConfiables:
      normalizarConteo(
        fila.no_confiables
      ),
    noRealizadas:
      normalizarConteo(
        fila.no_realizadas
      ),
    sinResultado:
      normalizarConteo(
        fila.sin_resultado
      ),
    ingreso:
      normalizarConteo(
        fila.ingreso
      ),
    mantenimiento:
      normalizarConteo(
        fila.mantenimiento
      ),
    sinMotivo:
      normalizarConteo(
        fila.sin_motivo
      ),
  };
}

async function obtenerMesesVisitas(
  anio: number
) {
  const resultado =
    await prisma.$queryRaw<ConteoMes[]>`
      WITH visitas AS (
        SELECT
          COALESCE(
            v."fechaRealizada",
            s."fechaGestion",
            s."fechaCierre",
            s."fechaCreacion"
          ) AS fecha_indicador
        FROM "SolicitudVisita" v
        INNER JOIN "Solicitud" s
          ON s."id" = v."solicitudId"
        WHERE s."tipo" = 'VISITA DOMICILIARIA'
        UNION ALL
        SELECT
          COALESCE(
            h."fechaVisitaDate",
            h."fechaSolicitudDate",
            h."createdAt"
          ) AS fecha_indicador
        FROM "VisitaHistorica" h
      )
      SELECT DISTINCT
        to_char(fecha_indicador, 'YYYY-MM') AS mes
      FROM visitas
      WHERE EXTRACT(YEAR FROM fecha_indicador)::int = ${anio}
      ORDER BY mes DESC
    `;

  return resultado.map(
    (fila) => fila.mes
  );
}

async function obtenerConteoVisitasPorMes(
  anio: number
) {
  const resultado =
    await prisma.$queryRaw<ConteoVisitasMes[]>`
      WITH visitas AS (
        SELECT
          COALESCE(
            v."fechaRealizada",
            s."fechaGestion",
            s."fechaCierre",
            s."fechaCreacion"
          ) AS fecha_indicador
        FROM "SolicitudVisita" v
        INNER JOIN "Solicitud" s
          ON s."id" = v."solicitudId"
        WHERE s."tipo" = 'VISITA DOMICILIARIA'
        UNION ALL
        SELECT
          COALESCE(
            h."fechaVisitaDate",
            h."fechaSolicitudDate",
            h."createdAt"
          ) AS fecha_indicador
        FROM "VisitaHistorica" h
      )
      SELECT
        to_char(fecha_indicador, 'YYYY-MM') AS mes,
        COUNT(*) AS total
      FROM visitas
      WHERE EXTRACT(YEAR FROM fecha_indicador)::int = ${anio}
      GROUP BY mes
      ORDER BY mes ASC
    `;

  return resultado.map(
    (fila) => ({
      mes: fila.mes,
      total:
        normalizarConteo(
          fila.total
        ),
    })
  );
}

function formatearMes(
  mes: string
) {
  const [
    anio,
    numeroMes,
  ] = mes.split("-");

  const fecha =
    new Date(
      Number(anio),
      Number(numeroMes) - 1,
      1
    );

  return fecha.toLocaleDateString(
    "es-CO",
    {
      month: "long",
      year: "numeric",
    }
  );
}

function obtenerMesActual() {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Bogota",
        year: "numeric",
        month: "2-digit",
      }
    ).formatToParts(new Date());

  const mapa =
    Object.fromEntries(
      partes.map((parte) => [
        parte.type,
        parte.value,
      ])
    );

  return `${mapa.year}-${mapa.month}`;
}

export default async function DashboardPage({

  searchParams,

}: {

  searchParams?: Promise<{
    estado?: string;
    mes?: string;
  }>;
}) {

  const params =
    await searchParams;

  const estadoSeleccionado =
    params?.estado || "";

  const mesSeleccionado =
    params?.mes || "";

  const mesActual =
    obtenerMesActual();

  const session =
    await getServerSession(
      authOptions
    );

  const role =
    session?.user?.role;

  const email =
    session?.user?.email;

  const fincaEAI =
    session?.user?.fincaEAI;

  // TODOS LOS TICKETS

  const solicitudes =
    ocultarSolicitudesHistoricas(
      await prisma.solicitud.findMany({

      where:
        obtenerWhereDashboardPorRol(
          role
        ),

      include: {

        cctv: true,

        visita: true,

        radio: true,

        antecedente: true,

        novedad: true,
      },

      orderBy: {
        fechaCreacion:
          "desc",
      },
    })
    );

  // FILTRO POR ROL

  let tickets =
    solicitudes;

const hace5Dias =
  new Date();

hace5Dias.setDate(
  hace5Dias.getDate() - 5
);
  if (role === "SOLICITANTE") {

  tickets =
    solicitudes.filter(
      (s: any) => {

        const visible =

          s.estado !==
            "COMPLETADO"

          ||

          (

            s.fechaCierre &&

            new Date(
              s.fechaCierre
            ) >= hace5Dias
          );

        return (

          solicitantePuedeVerSolicitud(
            s,
            email,
            fincaEAI
          )

          &&

          visible
        );
      }
    );
}

 if (
  role === "TECNICO"

  ||

  role === "JEFE_SEG"

  ||

  role === "DIRECTOR_SEG"
) {

  tickets =
    solicitudes.filter(
      (s: any) => {

        const visible =

          s.estado !==
            "COMPLETADO"

          ||

          (

            s.fechaCierre &&

            new Date(
              s.fechaCierre
            ) >= hace5Dias
          );

        const esSeguridad =

          role === "JEFE_SEG"

          ||

          role === "DIRECTOR_SEG";

        return (

          (

            s.tipo === "CCTV"

            ||

            s.tipo === "RADIOS"

            ||

            (

              esSeguridad

              &&

              s.tipo ===
                "NOVEDAD SEGURIDAD"
            )
          )

          &&

          visible
        );
      }
    );
}

  if (role === "VISITA") {

  tickets =
    solicitudes.filter(
      (s: any) => {

        const visible =

          s.estado !==
            "COMPLETADO"

          ||

          (

            s.fechaCierre &&

            new Date(
              s.fechaCierre
            ) >= hace5Dias
          );

        return (

          s.tipo ===
            "VISITA DOMICILIARIA"

          &&

          visible
        );
      }
    );
}

  if (role === "SUPERVISOR") {

  tickets =
    solicitudes.filter(
      (s: any) => {

        const visible =

          s.estado !==
            "COMPLETADO"

          ||

          (

            s.fechaCierre &&

            new Date(
              s.fechaCierre
            ) >= hace5Dias
          );

        return (

          s.tipo ===
            "ANTECEDENTES"

          &&

          visible
        );
      }
    );
}

  tickets =
    tickets.filter((ticket: any) =>
      visibleEnBandejaPorRol(
        ticket,
        role
      )
    );

  const usaMetricasMensualesGestor =
    role === "VISITA" ||
    role === "SUPERVISOR";

  const usaCompletadosMensualesNoClickable =
    usaMetricasMensualesGestor ||
    role === "SOLICITANTE";

  const diaMesColombia =
    obtenerDiaMesColombia();

  const mesGestor =
    usaMetricasMensualesGestor &&
    diaMesColombia <= 3
      ? obtenerMesAnterior(
          mesActual
        )
      : mesActual;

  const ticketsMetricas =
    role === "ADMIN"
      ? solicitudes
      : role === "VISITA"
        ? solicitudes.filter(
            (ticket: any) =>
              ticket.tipo ===
              "VISITA DOMICILIARIA"
          )
        : role === "SUPERVISOR"
          ? solicitudes.filter(
              (ticket: any) =>
                ticket.tipo ===
                "ANTECEDENTES"
            )
          : tickets;

  const ticketsMetricasSolicitante =
    role === "SOLICITANTE"
      ? solicitudes.filter(
          (ticket: any) =>
            solicitantePuedeVerSolicitud(
              ticket,
              email,
              fincaEAI
            )
        )
      : [];

  const puedeVerMetricasAntecedentes =
    role === "ADMIN"

    ||

    role === "DIRECTOR_SEG"

    ||

    role === "JEFE_SEG"

    ||

    role === "SUPERVISOR";

  const puedeVerMetricasVisitas =
    role === "ADMIN"

    ||

    role === "DIRECTOR_SEG"

    ||

    role === "JEFE_SEG"

    ||

    role === "VISITA";

  const puedeSeleccionarMes =
    role === "ADMIN";

  const aplicarFiltroMes =
    role === "SUPERVISOR";

  const mesIndicadores =
    puedeSeleccionarMes
      ? mesSeleccionado ||
        mesActual
      : usaMetricasMensualesGestor
        ? mesGestor
        : mesActual;

  const ticketsMetricasFiltradas =
    aplicarFiltroMes
      ? ticketsMetricas.filter(
          (ticket: any) =>
            obtenerMesTicket(
              ticket.fechaCreacion
            ) ===
            mesIndicadores
        )
      : ticketsMetricas;

  const ticketsMetricasMesIndicadores =
    ticketsMetricas.filter(
      (ticket: any) =>
        obtenerMesTicket(
          ticket.fechaCreacion
        ) === mesIndicadores
    );

  const ticketsMetricasEstados =
    role === "ADMIN"
      ? ticketsMetricas
      : aplicarFiltroMes
      ? ticketsMetricas.filter(
          (ticket: any) =>
            obtenerMesMetricaTicket(
              ticket
            ) ===
            mesIndicadores
        )
      : ticketsMetricas;

  const anioActual =
    new Date().getFullYear();

  const metricasAntecedentesMes =
    puedeVerMetricasAntecedentes
      ? await obtenerMetricasAntecedentes(
          mesIndicadores
        )
      : metricasAntecedentesVacias;

  const metricasAntecedentesAnio =
    puedeVerMetricasAntecedentes
      ? await obtenerMetricasAntecedentes(
          undefined,
          anioActual
        )
      : metricasAntecedentesVacias;

  const mesesAntecedentesDisponibles =
    puedeSeleccionarMes
      ? await obtenerMesesAntecedentes(
          anioActual
        )
      : [];

  const metricasVisitasMes =
    puedeVerMetricasVisitas
      ? await obtenerMetricasVisitas(
          mesIndicadores
        )
      : metricasVisitasVacias;

  const mesesVisitasDisponibles =
    puedeSeleccionarMes
      ? await obtenerMesesVisitas(
          anioActual
        )
      : [];

  const mesesDisponibles =
    Array.from(
      new Set(
        [
          ...solicitudes
            .filter(
              (ticket: any) =>
                new Date(
                  ticket.fechaCreacion
                ).getFullYear() ===
                anioActual
            )
            .map(
              (ticket: any) =>
                obtenerMesTicket(
                  ticket.fechaCreacion
                )
            ),
          ...mesesAntecedentesDisponibles,
          ...mesesVisitasDisponibles,
        ]
      )
    ).sort(
      (a, b) =>
        b.localeCompare(a)
    );

  // CONTADORES

  const pendientes =
    ticketsMetricasEstados.filter(
      (s: any) =>

        s.estado ===
        "Pendiente"
    ).length;

  const enProceso =
    ticketsMetricasEstados.filter(
      (s: any) =>

        s.estado ===
        "EN PROCESO"
    ).length;

  const reabiertos =
    ticketsMetricasEstados.filter(
      (s: any) =>

        s.estado ===
        "REABIERTO"
    ).length;

  const completados =
    role === "SOLICITANTE"
      ? ticketsMetricasSolicitante.filter(
          (s: any) =>
            s.estado ===
              "COMPLETADO" &&
            obtenerMesMetricaTicket(
              s
            ) === mesActual
        ).length
      : ticketsMetricasEstados.filter(
          (s: any) =>

            s.estado ===
            "COMPLETADO"
        ).length;

  const ticketsTablaBase =
    aplicarFiltroMes
      ? tickets.filter(
          (ticket: any) =>
            obtenerMesTicket(
              ticket.fechaCreacion
            ) ===
            mesIndicadores
        )
      : tickets;

  const ticketsFiltrados =
    estadoSeleccionado

      ? ticketsTablaBase.filter(
          (s: any) =>
            s.estado ===
            estadoSeleccionado
        )

      : ticketsTablaBase;

  const tarjetasEstado = [
    {
      titulo: "Pendientes",
      estado: "Pendiente",
      total: pendientes,
      color: "border-yellow-500 text-yellow-700 bg-yellow-50",
    },
    {
      titulo: "En proceso",
      estado: "EN PROCESO",
      total: enProceso,
      color: "border-blue-500 text-blue-700 bg-blue-50",
    },
    {
      titulo: "Reabiertos",
      estado: "REABIERTO",
      total: reabiertos,
      color: "border-red-500 text-red-700 bg-red-50",
    },
    {
      titulo: "Completados",
      estado: "COMPLETADO",
      total: completados,
      color: "border-green-500 text-green-700 bg-green-50",
    },
  ];

  const ahora =
    new Date();

  const ticketsAbiertos =
    ticketsMetricasFiltradas.filter(
      (ticket: any) =>
        ticket.estado !==
        "COMPLETADO"
    );

  const ticketsSinGestionMayor48h =
    ticketsAbiertos.filter(
      (ticket: any) =>
        ahora.getTime() -
          new Date(
            ticket.fechaCreacion
          ).getTime() >
        1000 * 60 * 60 * 48
    );

  const ticketMasAntiguo =
    ticketsAbiertos
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(
            a.fechaCreacion
          ).getTime() -
          new Date(
            b.fechaCreacion
          ).getTime()
      )[0];

  const diasTicketMasAntiguo =
    ticketMasAntiguo
      ? Math.max(
          0,
          Math.floor(
            (
              ahora.getTime() -
              new Date(
                ticketMasAntiguo.fechaCreacion
              ).getTime()
            ) /
              (
                1000 *
                60 *
                60 *
                24
              )
          )
        )
      : 0;

  const tiposSolicitud =
    Object.entries(
      ticketsMetricasFiltradas.reduce(
        (
          acumulado: Record<string, number>,
          ticket: any
        ) => {
          acumulado[ticket.tipo] =
            (
              acumulado[ticket.tipo] ||
              0
            ) + 1;

          return acumulado;
        },
        {}
      )
    )
      .map(
        ([tipo, total]) => ({
          tipo,
          total,
        })
      )
      .sort(
        (a, b) =>
          b.total - a.total
      );

  const mayorTipo =
    Math.max(
      ...tiposSolicitud.map(
        (item) => item.total
      ),
      1
    );

  const fincasTop =
    Object.entries(
      (
        role === "VISITA"
          ? ticketsMetricasMesIndicadores
          : ticketsMetricasFiltradas
      ).reduce(
        (
          acumulado: Record<string, number>,
          ticket: any
        ) => {
          const finca =
            obtenerFincaTicket(
              ticket
            );

          acumulado[finca] =
            (
              acumulado[finca] ||
              0
            ) + 1;

          return acumulado;
        },
        {}
      )
    )
      .map(
        ([finca, total]) => ({
          finca,
          total,
        })
      )
      .sort(
        (a, b) =>
          b.total - a.total
      )
      .slice(0, 5);

  const conteoVisitasMesesAnio =
    role === "VISITA"
      ? await obtenerConteoVisitasPorMes(
          anioActual
        )
      : [];

  const conteoVisitasPorMes =
    new Map(
      conteoVisitasMesesAnio.map(
        (item) => [
          item.mes,
          item.total,
        ]
      )
    );

  const visitasPorMesAnio =
    role === "VISITA"
      ? Array.from(
          {
            length: 12,
          },
          (_, indice) => {
            const mes =
              `${anioActual}-${String(
                indice + 1
              ).padStart(2, "0")}`;

            return {
              mes,
              total:
                conteoVisitasPorMes.get(
                  mes
                ) || 0,
            };
          }
        )
      : [];

  const mayorVisitasMes =
    Math.max(
      ...visitasPorMesAnio.map(
        (item) => item.total
      ),
      1
    );

  const continuarProceso =
    metricasAntecedentesMes.continuar;

  const noPuedeContinuar =
    metricasAntecedentesMes.noTenerEnCuenta;

  const documentoNoCorresponde =
    metricasAntecedentesMes.documentoNoCorresponde;

  const verificacionAnualSinHallazgos =
    metricasAntecedentesMes
      .verificacionAnualSinHallazgos;

  const verificacionAnualConHallazgos =
    metricasAntecedentesMes
      .verificacionAnualConHallazgos;

  const nacionales =
    metricasAntecedentesMes.nacionales;

  const extranjeros =
    metricasAntecedentesMes.extranjeros;

  const totalRegistrosEvaluados =
    metricasAntecedentesMes.total;

  const registrosAntecedentesAnioCurso =
    metricasAntecedentesAnio.total;

  const ticketsSolicitanteActivos =
    tickets.filter(
      (ticket: any) =>
        ticket.estado !==
        "COMPLETADO"
    );

  const ticketsSolicitanteCompletados =
    tickets.filter(
      (ticket: any) =>
        ticket.estado ===
        "COMPLETADO"
    );

  const ticketsSolicitanteConCierre =
    ticketsSolicitanteCompletados.filter(
      (ticket: any) =>
        ticket.fechaCierre
    );

  const promedioRespuestaSolicitante =
    ticketsSolicitanteConCierre.length > 0
      ? Math.round(
          ticketsSolicitanteConCierre.reduce(
            (
              total: number,
              ticket: any
            ) =>
              total +
              (
                new Date(
                  ticket.fechaCierre
                ).getTime() -
                new Date(
                  ticket.fechaCreacion
                ).getTime()
              ) /
                (
                  1000 *
                  60 *
                  60 *
                  24
                ),
            0
          ) /
            ticketsSolicitanteConCierre.length
        )
      : 0;

  const ultimasRespuestasSolicitante =
    ticketsSolicitanteCompletados
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(
            b.fechaCierre ||
              b.fechaCreacion
          ).getTime() -
          new Date(
            a.fechaCierre ||
              a.fechaCreacion
          ).getTime()
      )
      .slice(0, 4);

  return (

    <div className="p-8 bg-[#E8EEF2] min-h-screen">

  <div className="mb-10">

    <h1 className="text-4xl font-bold text-[#0F3D1F]">

      Dashboard

    </h1>

    <p className="text-gray-600 mt-2">

      Falcon Service Desk

    </p>

  </div>

      {puedeSeleccionarMes && (

        <form
          className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-md"
        >

          <div>

            <label
              htmlFor="mes"
              className="block text-xs font-bold uppercase text-gray-500"
            >
              Indicadores mensuales
            </label>

            <select
              id="mes"
              name="mes"
              defaultValue={
                mesSeleccionado
              }
              className="mt-2 rounded-lg border px-3 py-2 text-sm"
            >

              <option value="">
                General
              </option>

              {mesesDisponibles.map(
                (mes) => (

                  <option
                    key={mes}
                    value={mes}
                  >
                    {formatearMes(mes)}
                  </option>
                )
              )}

            </select>

          </div>

          <button
            type="submit"
            className="rounded-lg bg-[#0F3D1F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B2E17]"
          >
            Ver indicadores
          </button>

          {mesSeleccionado && (

            <Link
              href="/dashboard"
              className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Ver mes en curso
            </Link>
          )}

          <span className="text-sm text-gray-500">
            {mesSeleccionado
              ? `Mostrando ${formatearMes(
                  mesSeleccionado
                )}`
              : `Mostrando mes en curso: ${formatearMes(
                  mesActual
                )}`}
          </span>

        </form>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

        {tarjetasEstado.map(
          (tarjeta) => {

            const activa =
              estadoSeleccionado ===
              tarjeta.estado;

            const queryMes =
              puedeSeleccionarMes &&
              mesIndicadores
                ? `mes=${encodeURIComponent(
                    mesIndicadores
                  )}`
                : "";

            const hrefQuitarEstado =
              queryMes
                ? `/dashboard?${queryMes}`
                : "/dashboard";

            const hrefAplicarEstado =
              `/dashboard?estado=${encodeURIComponent(
                tarjeta.estado
              )}${
                queryMes
                  ? `&${queryMes}`
                  : ""
              }`;

            const noEsClickable =
              usaCompletadosMensualesNoClickable &&
              tarjeta.estado ===
                "COMPLETADO";

            const contenidoTarjeta = (
              <>
                <span className="text-xs font-semibold uppercase tracking-normal text-gray-500">
                  {tarjeta.titulo}
                </span>

                <div className="mt-2 flex items-end justify-between gap-3">

                  <strong className="text-3xl leading-none">
                    <NumeroAnimado
                      valor={tarjeta.total}
                    />
                  </strong>

                  <span className="text-xs font-medium text-gray-500">
                    {noEsClickable
                      ? formatearMes(
                          mesIndicadores
                        )
                      : "Ver"}
                  </span>

                </div>
              </>
            );

            if (noEsClickable) {
              return (
                <div
                  key={tarjeta.estado}
                  className={`
                    rounded-lg
                    border-l-4
                    bg-white
                    p-4
                    shadow-sm
                    ${tarjeta.color}
                  `}
                >
                  {contenidoTarjeta}
                </div>
              );
            }

            return (

              <Link
                key={tarjeta.estado}
                href={
                  activa
                    ? hrefQuitarEstado
                    : hrefAplicarEstado
                }
                className={`
                  rounded-lg
                  border-l-4
                  bg-white
                  p-4
                  shadow-sm
                  transition
                  hover:-translate-y-0.5
                  hover:shadow-md
                  ${tarjeta.color}
                  ${
                    activa
                      ? "ring-2 ring-[#0F3D1F]/20"
                      : ""
                  }
                `}
              >
                {contenidoTarjeta}

              </Link>
            );
          }
        )}

      </div>

      {puedeVerMetricasAntecedentes && (

        <div className="mb-8 grid grid-cols-1 xl:grid-cols-2 gap-4">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md xl:col-span-2">

            <h2 className="text-sm font-bold uppercase text-gray-500">
              Conceptos de antecedentes
            </h2>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">

              <div className="min-w-0 rounded-lg border bg-green-50 p-4">

                <span className="block text-xs font-semibold uppercase leading-5 text-gray-500">
                  Continuar el proceso
                </span>

                <p className="mt-3 break-words text-4xl font-bold leading-none text-green-700">
                  <NumeroAnimado
                    valor={continuarProceso}
                  />
                </p>

              </div>

              <div className="min-w-0 rounded-lg border bg-yellow-100 p-4">

                <span className="block text-xs font-semibold uppercase leading-5 text-gray-500">
                  No debe ser tenida en cuenta
                </span>

                <p className="mt-3 break-words text-4xl font-bold leading-none text-red-700">
                  <NumeroAnimado
                    valor={noPuedeContinuar}
                  />
                </p>

              </div>

              <div className="min-w-0 rounded-lg border bg-emerald-50 p-4">

                <span className="block text-xs font-semibold uppercase leading-5 text-gray-500">
                  No coinciden datos del documento
                </span>

                <p className="mt-3 break-words text-4xl font-bold leading-none text-emerald-800">
                  <NumeroAnimado
                    valor={documentoNoCorresponde}
                  />
                </p>

              </div>

              <div className="min-w-0 rounded-lg border bg-green-50 p-4">

                <span className="block text-xs font-semibold uppercase leading-5 text-gray-500">
                  Verificacion anual sin hallazgos
                </span>

                <p className="mt-3 break-words text-4xl font-bold leading-none text-green-700">
                  <NumeroAnimado
                    valor={verificacionAnualSinHallazgos}
                  />
                </p>

              </div>

              <div className="min-w-0 rounded-lg border bg-yellow-100 p-4">

                <span className="block text-xs font-semibold uppercase leading-5 text-gray-500">
                  Verificacion anual con hallazgos
                </span>

                <p className="mt-3 break-words text-4xl font-bold leading-none text-red-700">
                  <NumeroAnimado
                    valor={verificacionAnualConHallazgos}
                  />
                </p>

              </div>

            </div>

          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">

            <h2 className="text-sm font-bold uppercase text-gray-500">
              Nacionales y extranjeros
            </h2>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="min-w-0 rounded-lg border bg-blue-50 p-4">

                <span className="block text-xs font-semibold uppercase leading-5 text-gray-500">
                  Nacionales CC
                </span>

                <p className="mt-3 break-words text-4xl font-bold leading-none text-blue-700">
                  <NumeroAnimado
                    valor={nacionales}
                  />
                </p>

              </div>

              <div className="min-w-0 rounded-lg border bg-slate-50 p-4">

                <span className="block text-xs font-semibold uppercase leading-5 text-gray-500">
                  Extranjeros
                </span>

                <span className="mt-1 block text-xs font-semibold uppercase leading-5 text-gray-500">
                  PP, PPT y CE
                </span>

                <p className="mt-3 break-words text-4xl font-bold leading-none text-slate-800">
                  <NumeroAnimado
                    valor={extranjeros}
                  />
                </p>

              </div>

            </div>

            <p className="mt-3 text-xs text-gray-500">
              Total registros evaluados:
              {" "}
              <strong>
                <NumeroAnimado
                  valor={
                    totalRegistrosEvaluados
                  }
                />
              </strong>
            </p>

          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">

            <h2 className="text-sm font-bold uppercase text-gray-500">
              Histórico año en curso
            </h2>

            <div className="mt-4 rounded-lg border bg-gray-50 p-4">

              <span className="block text-xs font-semibold uppercase leading-5 text-gray-500">
                Registros {anioActual}
              </span>

              <p className="mt-3 break-words text-4xl font-bold leading-none text-[#0F3D1F]">
                <NumeroAnimado
                  valor={
                    registrosAntecedentesAnioCurso
                  }
                />
              </p>

            </div>

            <p className="mt-3 text-xs text-gray-500">
              Incluye registros cargados desde la base histórica y registros nuevos del sistema.
            </p>

          </div>

        </div>
      )}

      {puedeVerMetricasVisitas && (

        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-md">

          <div className="flex flex-wrap items-start justify-between gap-3">

            <div>

              <h2 className="text-sm font-bold uppercase text-gray-500">
                Visitas domiciliarias
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Indicadores de {formatearMes(mesIndicadores)}
              </p>

            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Total:
              {" "}
              <NumeroAnimado
                valor={
                  metricasVisitasMes.total
                }
              />
            </span>

          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_1.4fr]">

            <div className="rounded-lg border bg-blue-50 p-4">

              <span className="block text-xs font-semibold uppercase leading-5 text-gray-500">
                Tipo de visita
              </span>

              <div className="mt-3 grid grid-cols-2 gap-2">

                <div>
                  <p className="text-xs text-gray-500">
                    Ingreso
                  </p>
                  <strong className="text-2xl text-blue-700">
                    <NumeroAnimado
                      valor={
                        metricasVisitasMes.ingreso
                      }
                    />
                  </strong>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Mantenimiento
                  </p>
                  <strong className="text-2xl text-amber-700">
                    <NumeroAnimado
                      valor={
                        metricasVisitasMes.mantenimiento
                      }
                    />
                  </strong>
                </div>

              </div>

            </div>

            <div className="rounded-lg border bg-slate-50 p-4">

              <span className="block text-xs font-semibold uppercase leading-5 text-gray-500">
                Estado operativo
              </span>

              <div className="mt-3 grid grid-cols-2 gap-2">

                <div>
                  <p className="text-xs text-gray-500">
                    Pendientes
                  </p>
                  <strong className="text-2xl text-yellow-700">
                    <NumeroAnimado
                      valor={
                        metricasVisitasMes.pendientes
                      }
                    />
                  </strong>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Completadas
                  </p>
                  <strong className="text-2xl text-green-700">
                    <NumeroAnimado
                      valor={
                        metricasVisitasMes.completadas
                      }
                    />
                  </strong>
                </div>

              </div>

            </div>

            <div className="rounded-lg border bg-green-50 p-4">

              <span className="block text-xs font-semibold uppercase leading-5 text-gray-500">
                Resultado de completadas
              </span>

              <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">

                <div>
                  <p className="text-xs text-gray-500">
                    Confiables
                  </p>
                  <strong className="text-2xl text-green-700">
                    <NumeroAnimado
                      valor={
                        metricasVisitasMes.confiables
                      }
                    />
                  </strong>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    No confiables
                  </p>
                  <strong className="text-2xl text-red-700">
                    <NumeroAnimado
                      valor={
                        metricasVisitasMes.noConfiables
                      }
                    />
                  </strong>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    No se realizo
                  </p>
                  <strong className="text-2xl text-slate-700">
                    <NumeroAnimado
                      valor={
                        metricasVisitasMes.noRealizadas
                      }
                    />
                  </strong>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Sin resultado
                  </p>
                  <strong className="text-2xl text-slate-700">
                    <NumeroAnimado
                      valor={
                        metricasVisitasMes.sinResultado
                      }
                    />
                  </strong>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {role === "SOLICITANTE" && (

        <div className="mb-8 grid grid-cols-1 xl:grid-cols-3 gap-4">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">

            <h2 className="text-sm font-bold uppercase text-gray-500">
              Mi gestión
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">

              <div className="rounded-lg border bg-green-50 p-3">

                <span className="text-xs text-gray-500">
                  Activas
                </span>

                <p className="mt-1 text-2xl font-bold text-[#0F3D1F]">
                  {ticketsSolicitanteActivos.length}
                </p>

              </div>

              <div className="rounded-lg border bg-blue-50 p-3">

                <span className="text-xs text-gray-500">
                  Respondidas
                </span>

                <p className="mt-1 text-2xl font-bold text-blue-700">
                  {ticketsSolicitanteCompletados.length}
                </p>

              </div>

            </div>

            <div className="mt-4 rounded-lg border p-3">

              <span className="text-xs text-gray-500">
                Tiempo promedio de respuesta
              </span>

              <p className="mt-2 text-2xl font-bold text-gray-800">
                {promedioRespuestaSolicitante}
                {" "}
                días
              </p>

            </div>

          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">

            <h2 className="text-sm font-bold uppercase text-gray-500">
              Mis solicitudes por tipo
            </h2>

            <div className="mt-4 flex flex-col gap-3">

              {tiposSolicitud.slice(0, 5).map(
                (item) => (

                  <div key={item.tipo}>

                    <div className="mb-1 flex justify-between gap-3 text-sm">

                      <span className="font-medium text-gray-700">
                        {item.tipo}
                      </span>

                      <span className="font-bold text-gray-800">
                        {item.total}
                      </span>

                    </div>

                    <div className="h-2 rounded-full bg-gray-100">

                      <div
                        className="h-2 rounded-full bg-[#0F7A3B]"
                        style={{
                          width: `${Math.max(
                            8,
                            (
                              item.total /
                              mayorTipo
                            ) *
                              100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>
                )
              )}

              {tiposSolicitud.length === 0 && (

                <p className="text-sm text-gray-500">
                  Aún no tienes solicitudes registradas.
                </p>
              )}

            </div>

          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">

            <h2 className="text-sm font-bold uppercase text-gray-500">
              Últimas respuestas
            </h2>

            <div className="mt-4 flex flex-col gap-3">

              {ultimasRespuestasSolicitante.map(
                (ticket: any) => (

                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="rounded-lg border px-3 py-2 transition hover:bg-green-50"
                  >

                    <div className="flex items-center justify-between gap-3">

                      <span className="font-bold text-blue-700">
                        #{ticket.id}
                      </span>

                      <span className="text-xs font-semibold text-green-700">
                        Completado
                      </span>

                    </div>

                    <p className="mt-1 truncate text-sm text-gray-700">
                      {ticket.tipo}
                    </p>

                  </Link>
                )
              )}

              {ultimasRespuestasSolicitante.length === 0 && (

                <p className="text-sm text-gray-500">
                  Todavía no tienes respuestas recientes.
                </p>
              )}

            </div>

          </div>

        </div>
      )}

      {role !== "SOLICITANTE" && (

      <div className="mb-8 grid grid-cols-1 xl:grid-cols-3 gap-4">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">

          <h2 className="text-sm font-bold uppercase text-gray-500">
            Tiempo de gestion
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">

            <div className="rounded-lg border bg-gray-50 p-3">

              <span className="text-xs text-gray-500">
                Abiertos
              </span>

              <p className="mt-1 text-2xl font-bold text-[#0F3D1F]">
                {ticketsAbiertos.length}
              </p>

            </div>

            <div className="rounded-lg border bg-amber-50 p-3">

              <span className="text-xs text-gray-500">
                Más de 48h
              </span>

              <p className="mt-1 text-2xl font-bold text-amber-700">
                {ticketsSinGestionMayor48h.length}
              </p>

            </div>

          </div>

          <div className="mt-4 rounded-lg border p-3">

            <span className="text-xs text-gray-500">
              Ticket abierto más antiguo
            </span>

            {ticketMasAntiguo ? (

              <div className="mt-2 flex items-center justify-between gap-3">

                <Link
                  href={`/tickets/${ticketMasAntiguo.id}`}
                  className="font-bold text-blue-700 hover:underline"
                >
                  #{ticketMasAntiguo.id}
                </Link>

                <span className="text-sm font-semibold text-gray-700">
                  {diasTicketMasAntiguo}
                  {" "}
                  días
                </span>

              </div>
            ) : (

              <p className="mt-2 text-sm text-gray-500">
                Sin tickets abiertos
              </p>
            )}

          </div>

        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">

          {role === "VISITA" ? (

            <>

              <h2 className="text-sm font-bold uppercase text-gray-500">
                Visitas por mes
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Anio en curso {anioActual}
              </p>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">

                {visitasPorMesAnio.map(
                  (item) => (

                    <div
                      key={item.mes}
                      className="rounded-lg border bg-slate-50 px-3 py-2"
                    >

                      <div className="mb-1 flex items-center justify-between gap-3 text-xs">

                        <span className="font-semibold capitalize text-gray-600">
                          {formatearMes(
                            item.mes
                          ).replace(
                            ` de ${anioActual}`,
                            ""
                          )}
                        </span>

                        <span className="font-bold text-gray-800">
                          {item.total}
                        </span>

                      </div>

                      <div className="h-2 rounded-full bg-white">

                        <div
                          className="h-2 rounded-full bg-[#0F7A3B]"
                          style={{
                            width: item.total
                              ? `${Math.max(
                                  8,
                                  (
                                    item.total /
                                    mayorVisitasMes
                                  ) *
                                    100
                                )}%`
                              : "0%",
                          }}
                        />

                      </div>

                    </div>
                  )
                )}

              </div>

            </>
          ) : (

            <>

              <h2 className="text-sm font-bold uppercase text-gray-500">
                Solicitudes por tipo
              </h2>

              <div className="mt-4 flex flex-col gap-3">

                {tiposSolicitud.slice(0, 5).map(
                  (item) => (

                    <div key={item.tipo}>

                      <div className="mb-1 flex justify-between gap-3 text-sm">

                        <span className="font-medium text-gray-700">
                          {item.tipo}
                        </span>

                        <span className="font-bold text-gray-800">
                          {item.total}
                        </span>

                      </div>

                      <div className="h-2 rounded-full bg-gray-100">

                        <div
                          className="h-2 rounded-full bg-[#0F7A3B]"
                          style={{
                            width: `${Math.max(
                              8,
                              (
                                item.total /
                                mayorTipo
                              ) *
                                100
                            )}%`,
                          }}
                        />

                      </div>

                    </div>
                  )
                )}

              </div>

            </>
          )}

        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">

          <h2 className="text-sm font-bold uppercase text-gray-500">
            {role === "VISITA"
              ? "Fincas con mas solicitudes del mes"
              : "Fincas con mas solicitudes"}
          </h2>

          <div className="mt-4 flex flex-col gap-3">

            {fincasTop.map(
              (item, index) => (

                <div
                  key={item.finca}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >

                  <div className="min-w-0">

                    <span className="text-xs font-semibold text-gray-400">
                      #{index + 1}
                    </span>

                    <p className="truncate font-medium text-gray-800">
                      {item.finca}
                    </p>

                  </div>

                  <strong className="rounded-md bg-gray-100 px-2 py-1 text-sm">
                    {item.total}
                  </strong>

                </div>
              )
            )}

          </div>

        </div>

      </div>

      )}

      {/* ULTIMOS TICKETS */}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

          <div>

            <h2 className="text-xl font-bold">

              {estadoSeleccionado
                ? `Tickets ${estadoSeleccionado.toLowerCase()}`
                : "Últimos Tickets"}

            </h2>

            <p className="text-sm text-gray-500">

              Mostrando
              {" "}
              <strong>
                {ticketsFiltrados.length}
              </strong>
              {" "}
              registros

            </p>

          </div>

          {estadoSeleccionado && (

            <Link
              href={
                role === "ADMIN" &&
                mesIndicadores
                  ? `/dashboard?mes=${encodeURIComponent(
                      mesIndicadores
                    )}`
                  : "/dashboard"
              }
              className="rounded-md border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >

              Quitar filtro

            </Link>
          )}

        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

          <div className="hidden grid-cols-[90px_1.2fr_1fr_1fr_120px_110px] gap-3 border-b bg-slate-100 px-4 py-3 text-xs font-bold uppercase text-slate-600 md:grid">
            <span>Ticket</span>
            <span>Tipo</span>
            <span>Finca</span>
            <span>Solicitante</span>
            <span>Estado</span>
            <span>Accion</span>
          </div>

          {ticketsFiltrados.length ===
            0 && (
            <div className="p-6 text-sm text-gray-500">
              No hay tickets para mostrar.
            </div>
          )}

          {ticketsFiltrados
            .slice(0, 10)
            .map((ticket: any) => (
              <div
                key={ticket.id}
                className="grid gap-2 border-b px-4 py-4 text-sm last:border-b-0 md:grid-cols-[90px_1.2fr_1fr_1fr_120px_110px] md:items-center md:gap-3"
              >
                <div className="font-bold text-[#0F3D1F]">
                  #{ticket.id}
                </div>

                <div>
                  <p className="font-semibold">
                    {ticket.tipo}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatearFechaColombia(
                      ticket.fechaCreacion
                    )}
                  </p>
                </div>

                <div>
                  {obtenerFincaTicket(
                    ticket
                  )}
                </div>

                <div className="truncate">
                  {ticket.solicitante}
                </div>

                <div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {ticket.estado}
                  </span>
                </div>

                <Link
                  href={`/tickets/${ticket.id}`}
                  className="inline-flex justify-center rounded-lg bg-[#0F3D1F] px-3 py-2 text-xs font-semibold text-white hover:bg-[#14532d]"
                >
                  Ver ticket
                </Link>
              </div>
            ))}

        </div>

      </div>

    </div>
  );
}
