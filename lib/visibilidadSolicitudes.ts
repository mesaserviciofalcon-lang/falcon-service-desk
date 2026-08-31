type SolicitudVisibleParaSolicitante = {
  tipo: string;
  correoSolicitante?: string | null;
  antecedente?: {
    fincaEAI?: string | null;
  } | null;
};

const correosSoloSolicitudesPropias = new Set([
  "daniel.guzman@falconfarms.com.co",
]);

export function solicitanteSoloVeSusSolicitudes(
  email?: string | null
) {
  return correosSoloSolicitudesPropias.has(
    String(email || "")
      .trim()
      .toLowerCase()
  );
}

export function tiposPermitidosParaCrearSolicitud(
  email?: string | null
) {
  return solicitanteSoloVeSusSolicitudes(email)
    ? ["CCTV"]
    : null;
}

export function puedeCrearTipoSolicitud(
  email: string | null | undefined,
  tipo: string
) {
  const tiposPermitidos =
    tiposPermitidosParaCrearSolicitud(email);

  return (
    !tiposPermitidos ||
    tiposPermitidos.includes(tipo)
  );
}

export function solicitantePuedeVerSolicitud(
  solicitud: SolicitudVisibleParaSolicitante,
  email?: string | null,
  fincaEAI?: string | null
) {

  const esSolicitudPropia =
    Boolean(email) &&
    solicitud.correoSolicitante === email;

  const esAntecedenteMismaFinca =
    solicitud.tipo === "ANTECEDENTES" &&
    Boolean(fincaEAI) &&
    solicitud.antecedente?.fincaEAI === fincaEAI;

  return solicitanteSoloVeSusSolicitudes(email)
    ? esSolicitudPropia
    : (
        esSolicitudPropia ||
        esAntecedenteMismaFinca
      );
}
