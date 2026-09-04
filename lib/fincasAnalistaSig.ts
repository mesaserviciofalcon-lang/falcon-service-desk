type AnalistaSig = {
  nombre?: string | null;
  fincaEAI?: string | null;
};

function normalizar(valor?: string | null) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase();
}

/**
 * Cobertura operativa definida por Seguridad. Solo se amplía para las dos
 * analistas responsables de pares de fincas; los demás perfiles mantienen
 * la finca registrada en Usuario.fincaEAI.
 */
export function fincasAsignadasAnalistaSig(analista?: AnalistaSig | null) {
  const nombre = normalizar(analista?.nombre);
  if (nombre.includes("CARMENBONILLA")) return ["AB", "SZ"];
  if (nombre.includes("ALEJANDRABONETT")) return ["IB", "I4"];

  const finca = normalizar(analista?.fincaEAI);
  return finca ? [finca] : [];
}

export function analistaTieneAccesoAFinca(
  analista: AnalistaSig | null | undefined,
  finca: string | null | undefined,
) {
  const fincaNormalizada = normalizar(finca);
  return Boolean(
    fincaNormalizada &&
      fincasAsignadasAnalistaSig(analista).includes(fincaNormalizada),
  );
}
