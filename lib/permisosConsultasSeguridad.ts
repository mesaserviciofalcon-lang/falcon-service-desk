/** Roles que, por responsabilidad de Seguridad, pueden consultar información de todas las fincas. */
export function puedeVerTodasLasFincasEnConsultas(
  rol?: string | null
) {
  return [
    "ADMIN",
    "JEFE_SEG",
    "DIRECTOR_SEG",
  ].includes(String(rol || ""));
}

/** Las analistas con rol VISITA gestionan visitas domiciliarias para todas las fincas. */
export function puedeVerTodasLasFincasEnVisitas(
  rol?: string | null
) {
  return (
    puedeVerTodasLasFincasEnConsultas(rol) ||
    String(rol || "") === "VISITA"
  );
}
