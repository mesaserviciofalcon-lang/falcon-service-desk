export const OBSERVACION_NO_TENER_EN_CUENTA =
  "LA PERSONA NO DEBE SER TENIDA EN CUENTA";

export const OBSERVACION_DOCUMENTO_NO_CORRESPONDE =
  "EL NUMERO DE DOCUMENTO NO CORRESPONDE CON EL NOMBRE";

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
    registro.observacion ===
    OBSERVACION_NO_TENER_EN_CUENTA
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
