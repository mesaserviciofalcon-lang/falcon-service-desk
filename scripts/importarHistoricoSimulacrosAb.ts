import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Tipo = "SIMULACRO HURTO" | "SIMULACRO INTRUSION" | "SIMULACRO PAQUETE SOSPECHOSO" | "SIMULACRO CONTAMINACION";
type Aspecto = { nombre: string; calificacion: number };
type Registro = { consecutivo: string; fecha: Date; tipo: Tipo; area: string; horaInicio: string; supervisor: string; resultado: "DETECTADO" | "NO DETECTADO"; aspectos: Aspecto[]; conclusion: string; desarrollo: string; cierrePosterior?: string; reprogramar?: true };

const crearAspectos = (nombres: string[], calificaciones: number[]) => nombres.map((nombre, indice) => ({ nombre, calificacion: calificaciones[indice] }));
const hurto = (calificaciones: number[]) => crearAspectos(["Reporte de actividades sospechosas", "Controles de acceso", "Identificación de personas mediante el carné", "Cultura de seguridad", "Activación del plan de emergencia para los riesgos asociados"], calificaciones);
const intrusion = hurto;
const paquete = (calificaciones: number[]) => crearAspectos(["Reporte de actividades subestándar y detección temprana de paquetes sospechosos", "Plan de contingencia", "Cultura de seguridad", "Aseguramiento del área", "Activación del plan de emergencia para los riesgos asociados"], calificaciones);
const contaminacion = (calificaciones: number[]) => crearAspectos(["Conocimiento y aplicación de procedimientos ante actividades sospechosas", "Identificación e inspección del material de empaque", "Aseguramiento de áreas de trabajo", "Activación del plan de emergencia para los riesgos asociados"], calificaciones);

const registros: Registro[] = [
  { consecutivo: "SIM-AB-2026-001", fecha: new Date("2026-01-29T13:00:00.000Z"), tipo: "SIMULACRO HURTO", area: "RECEPCIÓN DE FLOR", horaInicio: "08:00", supervisor: "Javier Serna Vargas", resultado: "NO DETECTADO", aspectos: hurto([1, 1, 1, 1, 1]), conclusion: "El personal no tenía claros los controles ni el protocolo de alerta ante ingreso de personal ajeno. Fue subsanado por una ejecución posterior exitosa.", desarrollo: "Simulacro histórico importado desde AB2601. Se identificó la necesidad de capacitar en control de ingreso e identificación.", cierrePosterior: "SIM-AB-2026-005" },
  { consecutivo: "SIM-AB-2026-002", fecha: new Date("2026-03-26T13:00:00.000Z"), tipo: "SIMULACRO INTRUSION", area: "CUARTO DE MIPE", horaInicio: "08:00", supervisor: "Javier Serna Vargas", resultado: "NO DETECTADO", aspectos: intrusion([1, 1, 1, 1, 1]), conclusion: "No se cumplió el objetivo: se encontró la puerta abierta y fue posible sustraer elementos. Requiere reprogramación.", desarrollo: "Simulacro histórico importado desde AB2602. Se identificaron debilidades críticas de aseguramiento del cuarto de MIPE.", reprogramar: true },
  { consecutivo: "SIM-AB-2026-003", fecha: new Date("2026-04-23T14:00:00.000Z"), tipo: "SIMULACRO PAQUETE SOSPECHOSO", area: "ÁREA ADMINISTRATIVA", horaInicio: "09:00", supervisor: "Jose Reinel Perez Peña", resultado: "NO DETECTADO", aspectos: paquete([1, 1, 1, 1, 1]), conclusion: "El personal no tenía claro el procedimiento de manejo de correspondencia y paquete abandonado. Requiere reprogramación.", desarrollo: "Simulacro histórico importado desde AB2603. Se requiere reforzar correspondencia, paquetes sospechosos, reporte y cultura de seguridad.", reprogramar: true },
  { consecutivo: "SIM-AB-2026-004", fecha: new Date("2026-06-18T13:00:00.000Z"), tipo: "SIMULACRO CONTAMINACION", area: "VEHÍCULO MVCS", horaInicio: "08:00", supervisor: "Javier Serna Vargas", resultado: "DETECTADO", aspectos: contaminacion([3, 3, 3, 3]), conclusion: "La detección del sobre fue posible gracias a la inspección eficaz que realiza el personal de seguridad a los vehículos.", desarrollo: "Simulacro histórico importado desde AB2604. El control de inspección de vehículos permitió detectar el elemento sospechoso." },
  { consecutivo: "SIM-AB-2026-005", fecha: new Date("2026-08-18T14:00:00.000Z"), tipo: "SIMULACRO HURTO", area: "OFICINAS", horaInicio: "09:00", supervisor: "Jose Reinel Perez Peña", resultado: "DETECTADO", aspectos: hurto([3, 3, 3, 3, 3]), conclusion: "El personal de oficinas evidenció cultura de seguridad, alerta y claridad sobre el reporte inmediato al Analista SIG.", desarrollo: "Simulacro histórico importado desde AB2605. La intervención oportuna frustró la simulación de hurto en su fase inicial." },
];

function promedio(aspectos: Aspecto[]) { const puntos: Record<number, number> = { 3: 1, 2: 0.5, 1: 0 }; return aspectos.reduce((total, aspecto) => total + puntos[aspecto.calificacion], 0) / aspectos.length; }

async function main() {
  let importados = 0; let reprogramaciones = 0;
  for (const registro of registros) {
    if (await prisma.simulacroActividad.findUnique({ where: { consecutivo: registro.consecutivo }, select: { id: true } })) continue;
    const origenId = `HISTORICO-${registro.consecutivo}`;
    if (await prisma.actividadSupervisor.findUnique({ where: { origenId }, select: { id: true } })) continue;
    await prisma.$transaction(async (tx) => {
      const observaciones = registro.cierrePosterior ? `Cierre histórico validado: resultado subsanado por ejecución posterior exitosa ${registro.cierrePosterior}.` : registro.reprogramar ? "Pendiente de reprogramar: no existe una ejecución posterior exitosa del mismo tipo." : "Histórico cerrado por procedimiento anterior.";
      const actividad = await tx.actividadSupervisor.create({ data: { origenId, fechaPlaneada: registro.fecha, finca: "AB", actividad: registro.tipo, area: registro.area, supervisorNombre: registro.supervisor, estado: "TERMINADO", fechaCierre: registro.fecha, cumplidaEnFecha: true, cerradoPor: registro.supervisor, observacionesCierre: observaciones, creadoPor: "Importación histórica", creadoPorCorreo: "historico@falconservice.local", createdAt: registro.fecha } });
      await tx.simulacroActividad.create({ data: { actividadId: actividad.id, tipo: registro.tipo, finca: "AB", area: registro.area, grupoObjeto: `Personal de ${registro.area}`, personasInformadas: "Registro histórico importado", escenario: registro.area, horaInicio: registro.horaInicio, duracionMinutos: 30, consecutivo: registro.consecutivo, guion: "Registro histórico importado desde los formatos de simulacro AB 2026.", resultado: registro.resultado, cumplimientoObjetivo: registro.conclusion, desarrollo: registro.desarrollo, pasos: [{ descripcion: registro.desarrollo }], aspectos: registro.aspectos, promedioEvaluacion: promedio(registro.aspectos), conclusion: registro.conclusion, requiereSac: false, evidencias: [], creadoPor: registro.supervisor, creadoPorCorreo: "historico@falconservice.local", createdAt: registro.fecha } });
      if (registro.reprogramar) await tx.actividadSupervisor.create({ data: { origenId: `REPROGRAMACION-${registro.consecutivo}`, fechaPlaneada: new Date(), finca: "AB", actividad: registro.tipo, area: registro.area, estado: "PENDIENTE_ASIGNAR", observacionesCierre: `Reprogramación pendiente por resultado no detectado en ${registro.consecutivo}.`, creadoPor: "Importación histórica", creadoPorCorreo: "historico@falconservice.local" } });
    });
    importados++; if (registro.reprogramar) reprogramaciones++;
  }
  console.log(JSON.stringify({ total: registros.length, importados, reprogramaciones }));
}

main().finally(() => prisma.$disconnect());
