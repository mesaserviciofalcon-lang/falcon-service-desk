import { normalizarCargoUsuario } from "@/lib/permisosUsuarios";

const cargosConConsultaVisitas = new Set([
  "ADMINISTRADOR MASTER",
  "DIRECTOR GH",
  "DIRECTOR SEG",
  "JEFE SEG",
  "ANALISTA SIG",
  "ANALISTA SEGURIDAD",
]);

export function puedeConsultarVisitas(
  cargo?: string | null
) {
  return cargosConConsultaVisitas.has(
    normalizarCargoUsuario(cargo)
  );
}
