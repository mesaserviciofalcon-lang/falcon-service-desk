type SolicitudVisibleParaSolicitante = {
  tipo: string;
  correoSolicitante?: string | null;
  antecedente?: {
    fincaEAI?: string | null;
  } | null;
};

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

  return (
    esSolicitudPropia ||
    esAntecedenteMismaFinca
  );
}
