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
  "SEBASTIAN YUNDA",
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
  "ACCES",
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
