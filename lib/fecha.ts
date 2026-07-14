export function formatearFechaColombia(
  fecha: Date | string | null | undefined
) {

  if (!fecha) {

    return "";
  }

  return new Date(fecha).toLocaleString(
    "es-CO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Bogota",
    }
  );
}
