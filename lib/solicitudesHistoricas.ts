type SolicitudConAntecedente = {
  tipo?: string | null;
  antecedente?: {
    fincaEAI?: string | null;
  } | null;
};

export function esSolicitudHistorica(
  solicitud: SolicitudConAntecedente
) {
  return (
    solicitud.tipo === "ANTECEDENTES" &&
    solicitud.antecedente?.fincaEAI ===
      "HISTORICO"
  );
}

export function ocultarSolicitudesHistoricas<
  T extends SolicitudConAntecedente
>(solicitudes: T[]) {
  return solicitudes.filter(
    (solicitud) =>
      !esSolicitudHistorica(solicitud)
  );
}
