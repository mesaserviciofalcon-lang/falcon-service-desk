export const eaiOpciones = [
  "AJ",
  "P0",
  "SZ",
  "AB",
  "LC",
  "FPK",
  "LN",
  "TM",
  "LV",
  "IB",
  "ADM",
  "I4",
];

export const tipoDocumentoOpciones = [
  "PPT",
  "PP",
  "CE",
  "CC",
];

export const observacionAntecedenteOpciones = [
  "CONTINUAR CON EL PROCESO",
  "LA PERSONA NO DEBE SER TENIDA EN CUENTA",
  "EL NUMERO DE DOCUMENTO NO CORRESPONDE CON EL NOMBRE",
];

export const revisadoPorOpciones = [
  "CRISTIAN SALGADO",
  "YEISON HERNANDEZ",
  "JOSE PEREZ",
  "IVAN MORA",
  "JAVIER SERNA",
  "MAURICIO CALDERON",
  "LUIS CHARRY",
];

export const motivoAntecedenteOpciones = [
  "RMNC",
  "PRO.JUDUCIAL",
  "PONAL",
  "PROCURADURIA",
  "CONTRALORIA",
  "JEMPS",
  "SPOA",
  "GHESTOR",
];

export const motivoAntecedenteManualOpciones = [
  ...motivoAntecedenteOpciones,
  "FINCA",
];

export const autorizacionAntecedenteOpciones = [
  "JCRA",
  "JESG",
  "JR",
  "LECG",
];

export const rolesAntecedentesCompleto = [
  "ADMIN",
  "DIRECTOR_SEG",
  "JEFE_SEG",
  "SUPERVISOR",
];

export function puedeVerAntecedenteCompleto(
  role?: string | null
) {
  return Boolean(
    role &&
    rolesAntecedentesCompleto.includes(role)
  );
}

export function puedeImportarHistoricoAntecedentes(
  role?: string | null
) {
  return role === "ADMIN";
}

export const rolesEditarConsultaAntecedentes = [
  "ADMIN",
  "DIRECTOR_SEG",
  "JEFE_SEG",
];

export function puedeEditarConsultaAntecedentes(
  role?: string | null
) {
  return Boolean(
    role &&
    rolesEditarConsultaAntecedentes.includes(role)
  );
}
