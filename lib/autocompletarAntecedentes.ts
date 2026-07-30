import { prisma }
from "@/lib/prisma";

import {
  OBSERVACION_NO_TENER_EN_CUENTA,
} from "@/lib/validacionAntecedentesGestion";

const OBSERVACION_CONTINUAR =
  "CONTINUAR CON EL PROCESO";

type RegistroAntecedente = {
  id?: number;
  identificacion: string;
  fechaSolicitud?: string;
  fechaRespuesta?: string;
  eai?: string;
  nombresApellidos?: string;
  tipoDocumento?: string;
  fechaExpedicionDocumento?: string;
  observacion?: string;
  revisadoPor?: string;
  motivo?: string;
  autorizacion?: string;
  observaciones?: string;
};

function normalizarIdentificacion(
  identificacion: string
) {
  return identificacion
    .replace(/\D/g, "")
    .trim();
}

function parsearFechaRegistro(
  valor?: string | null
) {
  if (!valor) {
    return null;
  }

  const texto =
    valor.trim();

  const fechaIso =
    new Date(texto);

  if (
    !Number.isNaN(
      fechaIso.getTime()
    )
  ) {
    return fechaIso;
  }

  const partes =
    texto.match(
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
    );

  if (!partes) {
    return null;
  }

  const dia =
    Number(partes[1]);

  const mes =
    Number(partes[2]) - 1;

  const anio =
    Number(partes[3]);

  const fecha =
    new Date(anio, mes, dia);

  return Number.isNaN(
    fecha.getTime()
  )
    ? null
    : fecha;
}

function fechaBaseRegistro(
  registro: {
    fechaRespuesta?: string | null;
    fechaSolicitud?: string | null;
    createdAt: Date;
  }
) {
  return (
    parsearFechaRegistro(
      registro.fechaRespuesta
    ) ||
    parsearFechaRegistro(
      registro.fechaSolicitud
    ) ||
    registro.createdAt
  );
}

export async function autocompletarAntecedentes(
  registros: RegistroAntecedente[],
  opciones?: {
    excluirSolicitudId?: number;
  }
) {
  const idsActuales =
    registros
      .map((registro) => registro.id)
      .filter(
        (
          id
        ): id is number =>
          typeof id === "number"
      );

  const identificaciones =
    Array.from(
      new Set(
        registros
          .map((registro) =>
            normalizarIdentificacion(
              registro.identificacion
            )
          )
          .filter(Boolean)
      )
    );

  if (identificaciones.length === 0) {
    return registros;
  }

  const desde =
    new Date();

  desde.setMonth(
    desde.getMonth() - 3
  );

  const historicos =
    await prisma
      .antecedenteRegistro
      .findMany({
        where: {
          id:
            idsActuales.length > 0
              ? {
                  notIn:
                    idsActuales,
                }
              : undefined,
          identificacion: {
            in: identificaciones,
          },
          solicitudId:
            opciones?.excluirSolicitudId
              ? {
                  not:
                    opciones.excluirSolicitudId,
                }
              : undefined,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          identificacion: true,
          fechaRespuesta: true,
          fechaSolicitud: true,
          observacion: true,
          motivo: true,
          observaciones: true,
          createdAt: true,
        },
      });

  return registros.map(
    (registro) => {
      const identificacion =
        normalizarIdentificacion(
          registro.identificacion
        );

      const coincidencias =
        historicos.filter(
          (historico) =>
            normalizarIdentificacion(
              historico.identificacion
            ) === identificacion
        );

      const rechazoPrevio =
        coincidencias.find(
          (historico) =>
            historico.observacion ===
            OBSERVACION_NO_TENER_EN_CUENTA
        );

      if (rechazoPrevio) {
        return {
          ...registro,
          observacion:
            OBSERVACION_NO_TENER_EN_CUENTA,
          motivo:
            rechazoPrevio.motivo ||
            registro.motivo,
          observaciones:
            rechazoPrevio.observaciones ||
            registro.observaciones,
        };
      }

      const consultaReciente =
        coincidencias.find(
          (historico) =>
            fechaBaseRegistro(
              historico
            ) >= desde
        );

      if (consultaReciente) {
        return {
          ...registro,
          observacion:
            consultaReciente.observacion ||
            OBSERVACION_CONTINUAR,
        };
      }

      return registro;
    }
  );
}
