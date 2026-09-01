import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Tipo = "SIMULACRO HURTO" | "SIMULACRO PAQUETE SOSPECHOSO";
type Aspecto = { nombre: string; calificacion: number };
type Registro = { consecutivo: string; fecha: Date; tipo: Tipo; area: string; horaInicio: string; supervisor: string; resultado: "DETECTADO" | "NO DETECTADO"; aspectos: Aspecto[]; conclusion: string; desarrollo: string; reprogramar?: true; observaciones: string };

const crearAspectos = (nombres: string[], calificaciones: number[]) => nombres.map((nombre, indice) => ({ nombre, calificacion: calificaciones[indice] }));
const hurto = (calificaciones: number[]) => crearAspectos(["Reporte de actividades sospechosas", "Controles de acceso", "Identificación de personas mediante el carné", "Cultura de seguridad", "Activación del plan de emergencia para los riesgos asociados"], calificaciones);
const paquete = (calificaciones: number[]) => crearAspectos(["Reporte de actividades subestándar y detección temprana de paquetes sospechosos", "Plan de contingencia", "Cultura de seguridad", "Aseguramiento del área", "Activación del plan de emergencia para los riesgos asociados"], calificaciones);

const registros: Registro[] = [
  { consecutivo: "SIM-LN-2026-001", fecha: new Date("2026-01-15T15:00:00.000Z"), tipo: "SIMULACRO HURTO", area: "CASINO", horaInicio: "10:00", supervisor: "Jose Reinel Perez Peña", resultado: "NO DETECTADO", aspectos: hurto([1, 1, 1, 1, 1]), conclusion: "La puerta del cuarto de alimentos del casino permanecía abierta y sin control, permitiendo el ingreso de personas ajenas. El concepto se repitió en agosto, pero no superó el ejercicio.", desarrollo: "Simulacro histórico importado desde LN2601. Se identificó la necesidad de asegurar el área y capacitar en control de acceso y activación de emergencias.", observaciones: "Histórico: fue repetido en SIM-LN-2026-003, pero ese nuevo ejercicio tampoco fue detectado." },
  { consecutivo: "SIM-LN-2026-002", fecha: new Date("2026-04-24T14:00:00.000Z"), tipo: "SIMULACRO PAQUETE SOSPECHOSO", area: "ÁREA ADMINISTRATIVA", horaInicio: "09:00", supervisor: "Jose Reinel Perez Peña", resultado: "DETECTADO", aspectos: paquete([3, 3, 3, 3, 3]), conclusion: "Se evidenció eficacia en la detección del paquete sospechoso, el reporte y la activación del plan de contingencia.", desarrollo: "Simulacro histórico importado desde LN2602. El paquete fue detectado y reportado conforme al protocolo.", observaciones: "Histórico cerrado por procedimiento anterior." },
  { consecutivo: "SIM-LN-2026-003", fecha: new Date("2026-08-21T15:00:00.000Z"), tipo: "SIMULACRO HURTO", area: "CASETA DE MIRFE", horaInicio: "10:00", supervisor: "Jose Reinel Perez Peña", resultado: "NO DETECTADO", aspectos: hurto([1, 1, 1, 1, 1]), conclusion: "La puerta de la caseta de MIRFE permanecía abierta y sin control, permitiendo ingreso ajeno y posible sustracción o contaminación. Requiere reprogramación.", desarrollo: "Simulacro histórico importado desde LN2603. Se requiere reforzar aseguramiento del área, control de acceso y activación del plan de emergencia.", reprogramar: true, observaciones: "Pendiente de reprogramar: no existe una ejecución posterior exitosa del mismo tipo." },
];

function promedio(aspectos: Aspecto[]) { const puntos: Record<number, number> = { 3: 1, 2: 0.5, 1: 0 }; return aspectos.reduce((total, aspecto) => total + puntos[aspecto.calificacion], 0) / aspectos.length; }

async function main() {
  let importados = 0; let reprogramaciones = 0;
  for (const registro of registros) {
    if (await prisma.simulacroActividad.findUnique({ where: { consecutivo: registro.consecutivo }, select: { id: true } })) continue;
    const origenId = `HISTORICO-${registro.consecutivo}`;
    if (await prisma.actividadSupervisor.findUnique({ where: { origenId }, select: { id: true } })) continue;
    await prisma.$transaction(async (tx) => {
      const actividad = await tx.actividadSupervisor.create({ data: { origenId, fechaPlaneada: registro.fecha, finca: "LN", actividad: registro.tipo, area: registro.area, supervisorNombre: registro.supervisor, estado: "TERMINADO", fechaCierre: registro.fecha, cumplidaEnFecha: true, cerradoPor: registro.supervisor, observacionesCierre: registro.observaciones, creadoPor: "Importación histórica", creadoPorCorreo: "historico@falconservice.local", createdAt: registro.fecha } });
      await tx.simulacroActividad.create({ data: { actividadId: actividad.id, tipo: registro.tipo, finca: "LN", area: registro.area, grupoObjeto: `Personal de ${registro.area}`, personasInformadas: "Registro histórico importado", escenario: registro.area, horaInicio: registro.horaInicio, duracionMinutos: 30, consecutivo: registro.consecutivo, guion: "Registro histórico importado desde los formatos de simulacro LN 2026.", resultado: registro.resultado, cumplimientoObjetivo: registro.conclusion, desarrollo: registro.desarrollo, pasos: [{ descripcion: registro.desarrollo }], aspectos: registro.aspectos, promedioEvaluacion: promedio(registro.aspectos), conclusion: registro.conclusion, requiereSac: false, evidencias: [], creadoPor: registro.supervisor, creadoPorCorreo: "historico@falconservice.local", createdAt: registro.fecha } });
      if (registro.reprogramar) await tx.actividadSupervisor.create({ data: { origenId: `REPROGRAMACION-${registro.consecutivo}`, fechaPlaneada: new Date(), finca: "LN", actividad: registro.tipo, area: registro.area, estado: "PENDIENTE_ASIGNAR", observacionesCierre: `Reprogramación pendiente por resultado no detectado en ${registro.consecutivo}.`, creadoPor: "Importación histórica", creadoPorCorreo: "historico@falconservice.local" } });
    });
    importados++; if (registro.reprogramar) reprogramaciones++;
  }
  console.log(JSON.stringify({ total: registros.length, importados, reprogramaciones }));
}

main().finally(() => prisma.$disconnect());
