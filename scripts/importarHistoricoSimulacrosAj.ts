import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Tipo = "SIMULACRO HURTO" | "SIMULACRO INTRUSION" | "SIMULACRO PAQUETE SOSPECHOSO" | "SIMULACRO CONTAMINACION";
type Aspecto = { nombre: string; calificacion: number };
type Registro = { consecutivo: string; fecha: Date; tipo: Tipo; area: string; horaInicio: string; supervisor: string; resultado: "DETECTADO" | "NO DETECTADO"; aspectos: Aspecto[]; conclusion: string; desarrollo: string; reprogramar?: true };

const aspectos = (nombres: string[], calificaciones: number[]): Aspecto[] => nombres.map((nombre, indice) => ({ nombre, calificacion: calificaciones[indice] }));
const hurto = (calificaciones: number[]) => aspectos(["Reporte de actividades sospechosas", "Controles de acceso", "Identificación de personas mediante el carné", "Cultura de seguridad", "Activación del plan de emergencia para los riesgos asociados"], calificaciones);
const intrusion = hurto;
const paquete = (calificaciones: number[]) => aspectos(["Reporte de actividades subestándar y detección temprana de paquetes sospechosos", "Plan de contingencia", "Cultura de seguridad", "Aseguramiento del área", "Activación del plan de emergencia para los riesgos asociados"], calificaciones);
const contaminacion = (calificaciones: number[]) => aspectos(["Conocimiento y aplicación de procedimientos ante actividades sospechosas", "Identificación e inspección del material de empaque", "Aseguramiento de áreas de trabajo", "Activación del plan de emergencia para los riesgos asociados"], calificaciones);

const registros: Registro[] = [
  { consecutivo: "SIM-AJ-2026-001", fecha: new Date("2026-01-05T13:00:00.000Z"), tipo: "SIMULACRO HURTO", area: "OFICINA DE PRODUCCIÓN", horaInicio: "08:00", supervisor: "Javier Serna Vargas", resultado: "DETECTADO", aspectos: hurto([3, 3, 3, 3, 3]), conclusion: "Los controles de acceso del área de producción fueron eficaces y el personal aplicó los protocolos establecidos.", desarrollo: "Simulacro histórico importado desde el informe AJ2601. La persona fue detectada y reportada en el tiempo estimado." },
  { consecutivo: "SIM-AJ-2026-002", fecha: new Date("2026-02-18T13:00:00.000Z"), tipo: "SIMULACRO INTRUSION", area: "OFICINAS ADMINISTRATIVAS", horaInicio: "08:00", supervisor: "Javier Serna Vargas", resultado: "DETECTADO", aspectos: intrusion([3, 3, 3, 3, 3]), conclusion: "El simulacro cumplió satisfactoriamente el objetivo; se demostró eficacia en controles de acceso e identificación de personas no autorizadas.", desarrollo: "Simulacro histórico importado desde el informe AJ2602. La intrusión fue detectada oportunamente por el personal administrativo." },
  { consecutivo: "SIM-AJ-2026-003", fecha: new Date("2026-03-18T13:00:00.000Z"), tipo: "SIMULACRO PAQUETE SOSPECHOSO", area: "OFICINA DE GESTIÓN HUMANA", horaInicio: "08:00", supervisor: "Jose Reinel Perez Peña", resultado: "DETECTADO", aspectos: paquete([3, 3, 3, 3, 3]), conclusion: "Se evidenció eficacia en la detección del paquete sospechoso, el reporte y la activación del plan de contingencia.", desarrollo: "Simulacro histórico importado desde el informe AJ2603. El paquete fue detectado y reportado conforme al protocolo." },
  { consecutivo: "SIM-AJ-2026-004", fecha: new Date("2026-04-15T14:00:00.000Z"), tipo: "SIMULACRO CONTAMINACION", area: "EMPAQUE", horaInicio: "09:00", supervisor: "Sebastian Yunda Rodriguez", resultado: "DETECTADO", aspectos: contaminacion([3, 3, 3, 3]), conclusion: "El personal de empaque detectó los ramos contaminados gracias a una buena inspección y al conocimiento de los riesgos asociados.", desarrollo: "Simulacro histórico importado desde el informe AJ2604. Se detectó el material y se realizó la retroalimentación final." },
  { consecutivo: "SIM-AJ-2026-005", fecha: new Date("2026-05-13T11:00:00.000Z"), tipo: "SIMULACRO HURTO", area: "POSTCOSECHA", horaInicio: "06:00", supervisor: "Sebastian Yunda Rodriguez", resultado: "NO DETECTADO", aspectos: hurto([1, 1, 1, 1, 1]), conclusion: "Los controles de acceso de postcosecha no fueron eficaces y el objetivo no se cumplió. Requiere reprogramación.", desarrollo: "Simulacro histórico importado desde el informe AJ2605. Se identificaron debilidades en la aplicación de los protocolos de seguridad.", reprogramar: true },
  { consecutivo: "SIM-AJ-2026-006", fecha: new Date("2026-06-19T12:00:00.000Z"), tipo: "SIMULACRO CONTAMINACION", area: "CUARTOS FRÍOS Y DESPACHO", horaInicio: "07:00", supervisor: "Javier Serna Vargas", resultado: "DETECTADO", aspectos: contaminacion([3, 3, 3, 3]), conclusion: "El vigilante detectó la caja contaminada gracias a la verificación y al conocimiento de los riesgos asociados.", desarrollo: "Simulacro histórico importado desde el informe AJ2606. Se detectó el elemento durante la verificación de cajas hacia el despacho." },
  { consecutivo: "SIM-AJ-2026-007", fecha: new Date("2026-07-08T12:00:00.000Z"), tipo: "SIMULACRO INTRUSION", area: "ALMACÉN", horaInicio: "07:00", supervisor: "Sebastian Yunda Rodriguez", resultado: "NO DETECTADO", aspectos: intrusion([1, 1, 1, 1, 1]), conclusion: "Los controles del almacén no fueron eficaces; el intruso ingresó, se desplazó y sustrajo una llanta sin ser detectado. Requiere reprogramación.", desarrollo: "Simulacro histórico importado desde el informe AJ2607. Se identificaron debilidades en control de acceso, supervisión, inventarios y salida de materiales.", reprogramar: true },
  { consecutivo: "SIM-AJ-2026-008", fecha: new Date("2026-08-26T13:00:00.000Z"), tipo: "SIMULACRO PAQUETE SOSPECHOSO", area: "ÁREA ADMINISTRATIVA", horaInicio: "08:00", supervisor: "Ivan Dario Mora Cardenas", resultado: "DETECTADO", aspectos: paquete([3, 2, 3, 3, 2]), conclusion: "Se evidenció alerta y reacción temprana; se realizó retroalimentación para reforzar el protocolo de no manipular objetos sospechosos.", desarrollo: "Simulacro histórico importado desde el informe AJ2608. El elemento extraño fue detectado y reportado a Gestión Integral." },
];

function promedio(aspectosEvaluados: Aspecto[]) { const puntos: Record<number, number> = { 3: 1, 2: 0.5, 1: 0 }; return aspectosEvaluados.reduce((total, aspecto) => total + puntos[aspecto.calificacion], 0) / aspectosEvaluados.length; }

async function main() {
  let importados = 0; let reprogramaciones = 0;
  for (const registro of registros) {
    const existe = await prisma.simulacroActividad.findUnique({ where: { consecutivo: registro.consecutivo }, select: { id: true } });
    if (existe) continue;
    const origenId = `HISTORICO-${registro.consecutivo}`;
    if (await prisma.actividadSupervisor.findUnique({ where: { origenId }, select: { id: true } })) continue;
    await prisma.$transaction(async (tx) => {
      const actividad = await tx.actividadSupervisor.create({ data: { origenId, fechaPlaneada: registro.fecha, finca: "AJ", actividad: registro.tipo, area: registro.area, supervisorNombre: registro.supervisor, estado: "TERMINADO", fechaCierre: registro.fecha, cumplidaEnFecha: true, cerradoPor: registro.supervisor, observacionesCierre: registro.reprogramar ? "Pendiente de reprogramar: no existe una ejecución posterior exitosa del mismo tipo." : "Histórico cerrado por procedimiento anterior.", creadoPor: "Importación histórica", creadoPorCorreo: "historico@falconservice.local", createdAt: registro.fecha } });
      await tx.simulacroActividad.create({ data: { actividadId: actividad.id, tipo: registro.tipo, finca: "AJ", area: registro.area, grupoObjeto: `Personal de ${registro.area}`, personasInformadas: "Registro histórico importado", escenario: registro.area, horaInicio: registro.horaInicio, duracionMinutos: 30, consecutivo: registro.consecutivo, guion: "Registro histórico importado desde los formatos de simulacro AJ 2026.", resultado: registro.resultado, cumplimientoObjetivo: registro.conclusion, desarrollo: registro.desarrollo, pasos: [{ descripcion: registro.desarrollo }], aspectos: registro.aspectos, promedioEvaluacion: promedio(registro.aspectos), conclusion: registro.conclusion, requiereSac: false, evidencias: [], creadoPor: registro.supervisor, creadoPorCorreo: "historico@falconservice.local", createdAt: registro.fecha } });
      if (registro.reprogramar) { await tx.actividadSupervisor.create({ data: { origenId: `REPROGRAMACION-${registro.consecutivo}`, fechaPlaneada: new Date(), finca: "AJ", actividad: registro.tipo, area: registro.area, estado: "PENDIENTE_ASIGNAR", observacionesCierre: `Reprogramación pendiente por resultado no detectado en ${registro.consecutivo}.`, creadoPor: "Importación histórica", creadoPorCorreo: "historico@falconservice.local" } }); }
    });
    importados++; if (registro.reprogramar) reprogramaciones++;
  }
  console.log(JSON.stringify({ total: registros.length, importados, reprogramaciones }));
}

main().finally(() => prisma.$disconnect());
