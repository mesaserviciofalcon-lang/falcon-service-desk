export const OBSERVACION_NO_TENER_EN_CUENTA =
  "LA PERSONA NO DEBE SER TENIDA EN CUENTA";

export const OBSERVACION_DOCUMENTO_NO_CORRESPONDE =
  "NO COINCIDEN DATOS DEL DOCUMENTO";

export const OBSERVACION_DOCUMENTO_NO_CORRESPONDE_ANTERIOR =
  "EL NUMERO DE DOCUMENTO NO CORRESPONDE CON EL NOMBRE";

export const OBSERVACION_VERIFICACION_ANUAL_SIN_HALLAZGOS =
  "VERIFICACIÓN ANUAL NO PRESENTA HALLAZGOS";

export const OBSERVACION_VERIFICACION_ANUAL_CON_HALLAZGOS =
  "VERIFICACIÓN ANUAL PRESENTA HALLAZGOS";

type RegistroGestionAntecedente = {
  identificacion?: string | null;
  observacion?: string | null;
  revisadoPor?: string | null;
  motivo?: string | null;
  observaciones?: string | null;
};

export function valorDiligenciado(
  valor?: string | null
) {
  return Boolean(
    valor?.trim()
  );
}

function normalizarObservacion(
  valor?: string | null
) {
  return (valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function esObservacionNoTenerEnCuenta(
  observacion?: string | null
) {
  return (
    normalizarObservacion(observacion) ===
    normalizarObservacion(
      OBSERVACION_NO_TENER_EN_CUENTA
    )
  );
}

export function esObservacionVerificacionAnualConHallazgos(
  observacion?: string | null
) {
  return (
    normalizarObservacion(observacion) ===
    normalizarObservacion(
      OBSERVACION_VERIFICACION_ANUAL_CON_HALLAZGOS
    )
  );
}

export function esObservacionCriticaAntecedente(
  observacion?: string | null
) {
  return (
    esObservacionNoTenerEnCuenta(
      observacion
    ) ||
    esObservacionVerificacionAnualConHallazgos(
      observacion
    )
  );
}

export function esObservacionDocumentoNoCorresponde(
  observacion?: string | null
) {
  const valor =
    normalizarObservacion(observacion);

  return (
    valor ===
      normalizarObservacion(
        OBSERVACION_DOCUMENTO_NO_CORRESPONDE
      ) ||
    valor ===
      normalizarObservacion(
        OBSERVACION_DOCUMENTO_NO_CORRESPONDE_ANTERIOR
      ) ||
    valor.includes(
      "NO CORRESPONDE CON EL NOMBRE"
    ) ||
    valor.includes(
      "NO COINCIDE CON EL NOMBRE"
    ) ||
    valor.includes(
      "NO COINCIDEN DATOS DEL DOCUMENTO"
    )
  );
}

export function validarRegistroAntecedente(
  registro: RegistroGestionAntecedente
) {
  const referencia =
    registro.identificacion
      ? ` para la identificacion ${registro.identificacion}`
      : "";

  if (
    !valorDiligenciado(
      registro.observacion
    )
  ) {
    return `Debe seleccionar una observacion${referencia}`;
  }

  if (
    !valorDiligenciado(
      registro.revisadoPor
    )
  ) {
    return `Debe seleccionar quien reviso${referencia}`;
  }

  if (
    esObservacionCriticaAntecedente(
      registro.observacion
    )
  ) {
    if (
      !valorDiligenciado(
        registro.motivo
      )
    ) {
      return `Debe seleccionar un motivo${referencia}`;
    }

    if (
      !valorDiligenciado(
        registro.observaciones
      )
    ) {
      return `Debe diligenciar observaciones${referencia}`;
    }
  }

  return null;
}
