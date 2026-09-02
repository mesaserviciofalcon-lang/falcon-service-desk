export const cargosUsuario = [
  "ANALISTA SEGURIDAD",
  "ANALISTA SIG",
  "DIRECTOR GH",
  "ANALISTA GH",
  "ADMINISTRADOR MASTER",
  "ANALISTA SST",
  "DIRECTOR SEG",
  "JEFE SEG",
  "SUPERVISOR SEG",
  "TECNICO",
  "ANALISTA OPERACIONES DIGITALES",
] as const;

export type CargoUsuario =
  (typeof cargosUsuario)[number];

export function normalizarCargoUsuario(
  cargo?: string | null
) {
  return String(cargo || "")
    .trim()
    .toUpperCase();
}

export function esAnalistaSig(
  cargo?: string | null
) {
  return [
    "ANALISTA SIG",
    "ANALISTA SEGURIDAD",
  ].includes(normalizarCargoUsuario(cargo));
}

export function puedeVerVulnerabilidades(
  rol?: string | null,
  cargo?: string | null
) {
  return (
    [
      "ADMIN",
      "DIRECTOR_SEG",
      "JEFE_SEG",
      "SUPERVISOR",
    ].includes(String(rol || "")) ||
    esAnalistaSig(cargo)
  );
}

export function puedeGestionarVulnerabilidadesAsignadas(
  rol?: string | null,
  cargo?: string | null
) {
  return esAnalistaSig(cargo);
}
