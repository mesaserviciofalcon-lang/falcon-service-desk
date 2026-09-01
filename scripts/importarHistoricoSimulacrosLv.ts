import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Tipo = "SIMULACRO HURTO" | "SIMULACRO INTRUSION" | "SIMULACRO PAQUETE SOSPECHOSO";
type Aspecto = { nombre: string; calificacion: number };
type Registro = { consecutivo: string; fecha: Date; tipo: Tipo; area: string; horaInicio: string; supervisor: string; resultado: "DETECTADO" | "NO DETECTADO"; aspectos: Aspecto[]; conclusion: string; desarrollo: string; cierrePosterior?: string };

const crearAspectos = (nombres: string[], calificaciones: number[]) => nombres.map((nombre, indice) => ({ nombre, calificacion: calificaciones[indice] }));
const hurto = (calificaciones: number[]) => crearAspectos(["Reporte de actividades sospechosas", "Controles de acceso", "Identificación de personas mediante el carné", "Cultura de seguridad", "Activación del plan de emergencia para los riesgos asociados"], calificaciones);
const intrusion = hurto;
const paquete = (calificaciones: number[]) => crearAspectos(["Reporte de actividades subestándar y detección temprana de paquetes sospechosos", "Plan de contingencia", "Cultura de seguridad", "Aseguramiento del área", "Activación del plan de emergencia para los riesgos asociados"], calificaciones);

const registros: Registro[] = [
  { consecutivo: "SIM-LV-2026-001", fecha: new Date("2026-02-11T11:00:00.000Z"), tipo: "SIMULACRO PAQUETE SOSPECHOSO", area: "ÁREA ADMINISTRATIVA", horaInicio: "06:00", supervisor: "Sebastian Yunda Rodriguez", resultado: "NO DETECTADO", aspectos: paquete([1, 1, 1, 1, 1]), conclusion: "Se identificó necesidad de fortalecer inspección, sensibilización y manejo de paquetes sospechosos. Fue subsanado por una ejecución posterior exitosa.", desarrollo: "Simulacro histórico importado desde LV2601. Se registró necesidad de reentrenamiento y controles aleatorios más rigurosos.", cierrePosterior: "SIM-LV-2026-002" },
  { consecutivo: "SIM-LV-2026-002", fecha: new Date("2026-05-29T11:00:00.000Z"), tipo: "SIMULACRO PAQUETE SOSPECHOSO", area: "ÁREA ADMINISTRATIVA", horaInicio: "06:00", supervisor: "Cristian Camilo Salgado", resultado: "DETECTADO", aspectos: paquete([3, 3, 3, 3, 3]), conclusion: "El personal evidenció conocimiento del procedimiento de manejo de correspondencia y paquete sospechoso.", desarrollo: "Simulacro histórico importado desde LV2602. El paquete fue detectado y reportado conforme al protocolo." },
  { consecutivo: "SIM-LV-2026-003", fecha: new Date("2026-07-23T13:00:00.000Z"), tipo: "SIMULACRO INTRUSION", area: "TALLER", horaInicio: "08:00", supervisor: "Cristian Camilo Salgado", resultado: "DETECTADO", aspectos: intrusion([3, 3, 3, 3, 3]), conclusion: "El personal administrativo aplicó correctamente la identificación de personas y mantuvo aseguradas las áreas vulnerables.", desarrollo: "Simulacro histórico importado desde LV2603. La intrusión fue detectada y controlada de acuerdo con el protocolo." },
  { consecutivo: "SIM-LV-2026-004", fecha: new Date("2026-08-03T12:00:00.000Z"), tipo: "SIMULACRO HURTO", area: "ESTACIÓN MIRFE", horaInicio: "07:00", supervisor: "Cristian Camilo Salgado", resultado: "NO DETECTADO", aspectos: hurto([1, 1, 1, 1, 1]), conclusion: "Se requirió capacitación al personal de la estación MIRFE por desconocimiento de protocolos de seguridad. Fue subsanado por una ejecución posterior exitosa.", desarrollo: "Simulacro histórico importado desde LV2604. Se identificaron debilidades de identificación, cultura, reporte y activación del plan.", cierrePosterior: "SIM-LV-2026-005" },
  { consecutivo: "SIM-LV-2026-005", fecha: new Date("2026-08-24T12:00:00.000Z"), tipo: "SIMULACRO HURTO", area: "ESTACIÓN MIRFE", horaInicio: "07:00", supervisor: "Cristian Camilo Salgado", resultado: "DETECTADO", aspectos: hurto([3, 3, 3, 3, 3]), conclusion: "El personal de MIRFE conoce y cumple el procedimiento de control de acceso a áreas críticas; las instalaciones permanecen aseguradas.", desarrollo: "Simulacro histórico importado desde LV2605. El intruso fue detectado y reportado en el tiempo estimado." },
];

function promedio(aspectos: Aspecto[]) { const puntos: Record<number, number> = { 3: 1, 2: 0.5, 1: 0 }; return aspectos.reduce((total, aspecto) => total + puntos[aspecto.calificacion], 0) / aspectos.length; }

async function main() {
  let importados = 0;
  for (const registro of registros) {
    if (await prisma.simulacroActividad.findUnique({ where: { consecutivo: registro.consecutivo }, select: { id: true } })) continue;
    const origenId = `HISTORICO-${registro.consecutivo}`;
    if (await prisma.actividadSupervisor.findUnique({ where: { origenId }, select: { id: true } })) continue;
    await prisma.$transaction(async (tx) => {
      const observaciones = registro.cierrePosterior ? `Cierre histórico validado: resultado subsanado por ejecución posterior exitosa ${registro.cierrePosterior}.` : "Histórico cerrado por procedimiento anterior.";
      const actividad = await tx.actividadSupervisor.create({ data: { origenId, fechaPlaneada: registro.fecha, finca: "LV", actividad: registro.tipo, area: registro.area, supervisorNombre: registro.supervisor, estado: "TERMINADO", fechaCierre: registro.fecha, cumplidaEnFecha: true, cerradoPor: registro.supervisor, observacionesCierre: observaciones, creadoPor: "Importación histórica", creadoPorCorreo: "historico@falconservice.local", createdAt: registro.fecha } });
      await tx.simulacroActividad.create({ data: { actividadId: actividad.id, tipo: registro.tipo, finca: "LV", area: registro.area, grupoObjeto: `Personal de ${registro.area}`, personasInformadas: "Registro histórico importado", escenario: registro.area, horaInicio: registro.horaInicio, duracionMinutos: 30, consecutivo: registro.consecutivo, guion: "Registro histórico importado desde los formatos de simulacro LV 2026.", resultado: registro.resultado, cumplimientoObjetivo: registro.conclusion, desarrollo: registro.desarrollo, pasos: [{ descripcion: registro.desarrollo }], aspectos: registro.aspectos, promedioEvaluacion: promedio(registro.aspectos), conclusion: registro.conclusion, requiereSac: false, evidencias: [], creadoPor: registro.supervisor, creadoPorCorreo: "historico@falconservice.local", createdAt: registro.fecha } });
    });
    importados++;
  }
  console.log(JSON.stringify({ total: registros.length, importados, cierresPorRepeticion: registros.filter((registro) => registro.cierrePosterior).length }));
}

main().finally(() => prisma.$disconnect());
