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

export function obtenerFechaActualColombiaISO() {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "America/Bogota",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(new Date());

  const mapa =
    Object.fromEntries(
      partes.map((parte) => [
        parte.type,
        parte.value,
      ])
    );

  return `${mapa.year}-${mapa.month}-${mapa.day}`;
}
