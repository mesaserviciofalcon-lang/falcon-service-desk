import { normalizarCargoUsuario } from "@/lib/permisosUsuarios";

function normalizarNombre(
  nombre?: string | null
) {
  return String(nombre || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

export function puedeVerAnuario({
  rol,
  cargo,
  nombre,
}: {
  rol?: string | null;
  cargo?: string | null;
  nombre?: string | null;
}) {
  return (
    [
      "SUPERVISOR",
      "DIRECTOR_SEG",
      "JEFE_SEG",
    ].includes(String(rol || "")) ||
    puedeAdministrarAnuario({ rol }) ||
    (
      normalizarCargoUsuario(cargo) === "DIRECTOR GH" &&
      normalizarNombre(nombre) ===
        "YULIANDRI QUINTANA"
    )
  );
}

export function puedeAdministrarAnuario({
  rol,
}: {
  rol?: string | null;
}) {
  return String(rol || "") === "ADMIN";
}

export function puedeVerOrganigramaSeguridad({
  rol,
}: {
  rol?: string | null;
}) {
  return String(rol || "") !== "TECNICO";
}
