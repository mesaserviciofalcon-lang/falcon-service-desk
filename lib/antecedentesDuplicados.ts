type RegistroAntecedenteParaComparar = {
  identificacion?: string | null;
  fechaExpedicionDocumento?: string | null;
};

function normalizarDocumento(
  valor?: string | null
) {
  return String(valor || "")
    .replace(/\D/g, "")
    .trim();
}

function normalizarFecha(
  valor?: string | null
) {
  return String(valor || "")
    .trim()
    .replace(/\//g, "-");
}

export function firmaRegistrosAntecedentes(
  registros: RegistroAntecedenteParaComparar[]
) {
  return registros
    .map((registro) => {
      const documento = normalizarDocumento(
        registro.identificacion
      );
      const fecha = normalizarFecha(
        registro.fechaExpedicionDocumento
      );

      return documento && fecha
        ? `${documento}|${fecha}`
        : "";
    })
    .filter(Boolean)
    .sort()
    .join(",");
}

export function esMismoLoteAntecedentes(
  registrosNuevos: RegistroAntecedenteParaComparar[],
  registrosExistentes: RegistroAntecedenteParaComparar[]
) {
  const firmaNueva =
    firmaRegistrosAntecedentes(
      registrosNuevos
    );
  const firmaExistente =
    firmaRegistrosAntecedentes(
      registrosExistentes
    );

  return (
    Boolean(firmaNueva) &&
    firmaNueva === firmaExistente
  );
}
