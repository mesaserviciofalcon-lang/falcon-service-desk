type SolicitudConEstado = {
  estado?: string | null;
  fechaCierre?: Date | string | null;
};

export function normalizarEstadoTicket(
  estado?: string | null
) {
  return String(estado || "")
    .trim()
    .toUpperCase();
}

export function esTicketCompletado(
  solicitud: SolicitudConEstado
) {
  return [
    "COMPLETADO",
    "CERRADO",
  ].includes(
    normalizarEstadoTicket(
      solicitud.estado
    )
  );
}

export function completadoVisibleParaSolicitante(
  solicitud: SolicitudConEstado,
  diasVisibles = 5
) {
  if (!esTicketCompletado(solicitud)) {
    return true;
  }

  if (!solicitud.fechaCierre) {
    return false;
  }

  const fechaLimite =
    new Date();

  fechaLimite.setDate(
    fechaLimite.getDate() -
      diasVisibles
  );

  return (
    new Date(solicitud.fechaCierre) >=
    fechaLimite
  );
}

export function visibleEnBandejaPorRol(
  solicitud: SolicitudConEstado,
  role?: string | null
) {
  if (role === "ADMIN") {
    return true;
  }

  if (role === "SOLICITANTE") {
    return completadoVisibleParaSolicitante(
      solicitud
    );
  }

  return !esTicketCompletado(solicitud);
}
