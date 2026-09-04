export const ESTADO_CCTV_APROBADO =
  "APROBADO PARA EJECUCION";

type TecnicoCctv = {
  nombre: string;
  correo: string;
  eais: string[];
};

const tecnicosCctv: TecnicoCctv[] = [
  {
    nombre: "Andres Alvarez",
    correo: "comercial@viptechnology.co",
    eais: ["LV", "IB", "I4"],
  },
  {
    nombre: "Jamid Moncada",
    correo: "jamidmoncada@terra-interiors.co",
    eais: [
      "AJ",
      "P0",
      "SZ",
      "AB",
      "LN",
      "TM",
      "LC",
      "FPK",
      "SEG",
      "ADM",
    ],
  },
];

function normalizar(valor?: string | null) {
  return String(valor || "")
    .trim()
    .toUpperCase();
}

export function obtenerTecnicoCctvPorEai(
  eai?: string | null
) {
  const eaiNormalizada = normalizar(eai);

  return tecnicosCctv.find((tecnico) =>
    tecnico.eais.includes(eaiNormalizada)
  );
}

export function puedeAprobarEjecucionCctv(
  rol?: string | null
) {
  return [
    "ADMIN",
    "JEFE_SEG",
    "DIRECTOR_SEG",
  ].includes(String(rol || ""));
}

export function esCctvAprobadoParaGestion(
  estado?: string | null
) {
  return [
    ESTADO_CCTV_APROBADO,
    "EN PROCESO",
  ].includes(normalizar(estado));
}

export function tecnicoPuedeGestionarCctv({
  rol,
  correo,
  eai,
  estado,
}: {
  rol?: string | null;
  correo?: string | null;
  eai?: string | null;
  estado?: string | null;
}) {
  const tecnico =
    obtenerTecnicoCctvPorEai(eai);

  return (
    rol === "TECNICO" &&
    Boolean(tecnico) &&
    tecnico?.correo ===
      String(correo || "")
        .trim()
        .toLowerCase() &&
    esCctvAprobadoParaGestion(estado)
  );
}

export function tecnicoPuedeVerCctv({
  rol,
  correo,
  eai,
}: {
  rol?: string | null;
  correo?: string | null;
  eai?: string | null;
}) {
  const tecnico =
    obtenerTecnicoCctvPorEai(eai);

  return (
    rol === "TECNICO" &&
    Boolean(tecnico) &&
    tecnico?.correo ===
      String(correo || "")
        .trim()
        .toLowerCase()
  );
}
