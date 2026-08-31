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
    normalizarCargoUsuario(cargo) ===
      "ANALISTA SIG"
  );
}

export function puedeGestionarVulnerabilidadesAsignadas(
  rol?: string | null,
  cargo?: string | null
) {
  return normalizarCargoUsuario(cargo) === "ANALISTA SIG";
}
