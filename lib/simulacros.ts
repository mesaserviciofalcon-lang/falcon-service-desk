import { obtenerContactosVulnerabilidad } from "@/lib/vulnerabilidades";

export const tiposSimulacro = [
  "SIMULACRO HURTO",
  "SIMULACRO INTRUSION",
  "SIMULACRO PAQUETE SOSPECHOSO",
  "SIMULACRO CONTAMINACION",
] as const;

export const factoresSac = [
  "Roles y Responsabilidades",
  "Capacitación y Competencia",
  "Estandarización",
  "Recursos",
  "Aseguramiento",
  "Factores Externos",
] as const;

type Definicion = {
  riesgo: string;
  objetivo: string;
  controles: string[];
  aspectos: string[];
  guion: (area: string, analista: string) => string;
};

const controlesAcceso = [
  "Controles de acceso",
  "Identificación de personas mediante el carné",
  "Cultura de seguridad",
];

const definiciones: Record<(typeof tiposSimulacro)[number], Definicion> = {
  "SIMULACRO HURTO": {
    riesgo: "Hurto",
    objetivo: "Medir la eficacia de los controles establecidos para el aseguramiento de activos de la compañía y la activación del plan de emergencia frente a riesgos asociados a hurto.",
    controles: controlesAcceso,
    aspectos: [
      "Reporte de actividades sospechosas",
      ...controlesAcceso,
      "Activación del plan de emergencia para los riesgos asociados",
    ],
    guion: (area, analista) => `Se coordina con ${analista}, Analista SIG, el ingreso al área de ${area} para la ejecución del simulacro. Se realizará un recorrido para identificar productos o equipos sin aseguramiento. Si los controles impiden el ingreso o los elementos están asegurados, se finaliza el ejercicio y se realiza retroalimentación. Si es posible ingresar sin ser detectado, se verifican objetos de valor y se simula su extracción, manteniendo control de la actividad en todo momento y deteniéndola ante cualquier riesgo para los participantes.`,
  },
  "SIMULACRO INTRUSION": {
    riesgo: "Intrusión",
    objetivo: "Medir y evaluar los procedimientos y protocolos establecidos para la detección de personal no autorizado, control de acceso y reporte de actividades subestándar.",
    controles: controlesAcceso,
    aspectos: [
      "Tiempo de respuesta del grupo objeto",
      "Detección y reporte de personas o actividades sospechosas",
      ...controlesAcceso,
      "Activación del plan de emergencia para los riesgos asociados",
    ],
    guion: (area, analista) => `En coordinación con ${analista}, Analista SIG, se programa la intrusión de una persona por el acceso del área de ${area}. El participante se presenta como visitante o proveedor y queda a disposición de los controles del personal. Si no es detectado, recorre el área y simula la extracción de un elemento. El coordinador controla el ejercicio, lo detiene ante cualquier riesgo y realiza retroalimentación con el personal involucrado.`,
  },
  "SIMULACRO PAQUETE SOSPECHOSO": {
    riesgo: "Paquete sospechoso",
    objetivo: "Evaluar la capacidad de detección, reporte y activación del plan de emergencia ante la presencia de un paquete sospechoso.",
    controles: [
      "Reporte de actividades subestándar",
      "Cultura de seguridad",
      "Control de áreas restringidas",
      "Activación del plan de emergencia",
    ],
    aspectos: [
      "Tiempo de respuesta del grupo objeto",
      "Detección y reporte del paquete sospechoso",
      "Aseguramiento del área",
      "Activación del plan de emergencia para los riesgos asociados",
    ],
    guion: (area, analista) => `En coordinación con ${analista}, Analista SIG, se ubica un elemento simulado como paquete sospechoso en el área de ${area}. El personal queda a disposición de los controles definidos para la detección, reporte y aislamiento. El coordinador observará la reacción, controlará la seguridad de los participantes, comunicará que se trata de un simulacro y realizará la retroalimentación final.`,
  },
  "SIMULACRO CONTAMINACION": {
    riesgo: "Contaminación de la carga",
    objetivo: "Medir y evaluar los procedimientos de detección de material sospechoso, inspección de empaque, reporte de actividades subestándar y activación del plan de contingencia.",
    controles: [
      "Cultura de seguridad",
      "Reporte de actividades subestándar",
      "Circuito cerrado de televisión monitoreado",
      "Control de áreas restringidas",
      "Identificación de cargos críticos",
      "Identificación de personal visitante y contratista",
      "Control de acceso",
    ],
    aspectos: [
      "Tiempo de respuesta del grupo objeto",
      "Conocimiento y aplicación de procedimientos ante actividades sospechosas",
      "Identificación e inspección del material de empaque",
      "Aseguramiento de áreas de trabajo",
      "Activación del plan de emergencia para los riesgos asociados",
    ],
    guion: (area, analista) => `En coordinación con ${analista}, Analista SIG, se realiza una simulación de contaminación de la carga en el área de ${area}. Se ubica material simulado a disposición de los controles de inspección. El coordinador observará la detección, reporte, aislamiento y aplicación del plan de contingencia; mantendrá el control del ejercicio y hará retroalimentación al finalizar.`,
  },
};

export function esActividadSimulacro(actividad?: string | null) {
  return tiposSimulacro.includes(String(actividad || "").trim().toUpperCase() as (typeof tiposSimulacro)[number]);
}

export function definicionSimulacro(tipo: string, area?: string | null, finca?: string | null) {
  const tipoNormalizado = String(tipo || "").trim().toUpperCase() as (typeof tiposSimulacro)[number];
  const definicion = definiciones[tipoNormalizado];
  if (!definicion) return null;
  const contactos = obtenerContactosVulnerabilidad(String(finca || ""));
  const analista = contactos.analista?.nombre || "el Analista SIG de la finca";
  const areaNombre = String(area || "área definida");
  return {
    tipo: tipoNormalizado,
    riesgo: definicion.riesgo,
    objetivo: definicion.objetivo,
    controles: definicion.controles,
    aspectos: definicion.aspectos,
    analista,
    correoAnalista: contactos.analista?.correo || null,
    gerente: contactos.gerente || null,
    guionInicial: definicion.guion(areaNombre, analista),
  };
}

export function desarrolloInicial(horaInicio: string, guion: string) {
  return `${horaInicio} - Por parte del coordinador del simulacro se explica la ejecución de la actividad y su alcance, según el guion establecido.\n\n${horaInicio} - ${guion}\n\n[Continúe aquí el desarrollo cronológico del simulacro.]`;
}

export function requiereSac(resultado: string) {
  return ["NO DETECTADO", "PERDIDO"].includes(String(resultado || "").trim().toUpperCase());
}

export function calcularPromedioSimulacro(aspectos: Array<{ calificacion: number | string }> | null | undefined) {
  if (!aspectos?.length) return null;
  const puntos: Record<number, number> = { 3: 1, 2: 0.5, 1: 0 };
  const calificaciones = aspectos.map((aspecto) => Number(aspecto.calificacion)).filter((calificacion) => Object.hasOwn(puntos, calificacion));
  if (!calificaciones.length) return null;
  return calificaciones.reduce((total, calificacion) => total + puntos[calificacion], 0) / calificaciones.length;
}

export function mismaFincaSimulacro(fincaUsuario?: string | null, fincaSimulacro?: string | null) {
  const normalizar = (valor?: string | null) => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const aliases: Record<string, string> = { FLOPACK: "FPK", FPK: "FPK" };
  const usuario = aliases[normalizar(fincaUsuario)] || normalizar(fincaUsuario);
  const simulacro = aliases[normalizar(fincaSimulacro)] || normalizar(fincaSimulacro);
  return Boolean(usuario && simulacro && usuario === simulacro);
}
