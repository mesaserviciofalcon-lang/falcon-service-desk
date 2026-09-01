import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Tipo = "SIMULACRO HURTO" | "SIMULACRO INTRUSION" | "SIMULACRO PAQUETE SOSPECHOSO";
type Aspecto = { nombre: string; calificacion: number };
type Registro = { consecutivo: string; fecha: Date; tipo: Tipo; area: string; horaInicio: string; supervisor: string; aspectos: Aspecto[]; conclusion: string; desarrollo: string };

const crearAspectos = (nombres: string[], calificaciones: number[]) => nombres.map((nombre, indice) => ({ nombre, calificacion: calificaciones[indice] }));
const hurto = (calificaciones: number[]) => crearAspectos(["Reporte de actividades sospechosas", "Controles de acceso", "Identificación de personas mediante el carné", "Cultura de seguridad", "Activación del plan de emergencia para los riesgos asociados"], calificaciones);
const intrusion = hurto;
const paquete = (calificaciones: number[]) => crearAspectos(["Reporte de actividades subestándar y detección temprana de paquetes sospechosos", "Plan de contingencia", "Cultura de seguridad", "Aseguramiento del área", "Activación del plan de emergencia para los riesgos asociados"], calificaciones);

const registros: Registro[] = [
  { consecutivo: "SIM-P0-2026-001", fecha: new Date("2026-01-26T13:00:00.000Z"), tipo: "SIMULACRO HURTO", area: "OFICINAS", horaInicio: "08:00", supervisor: "Jose Reinel Perez Peña", aspectos: hurto([3, 3, 3, 3, 3]), conclusion: "El personal del área tiene claro el procedimiento de control de acceso e identificación de personas en áreas restringidas.", desarrollo: "Simulacro histórico importado desde el informe PO2601. La situación fue detectada y se realizó la retroalimentación correspondiente." },
  { consecutivo: "SIM-P0-2026-002", fecha: new Date("2026-03-10T15:00:00.000Z"), tipo: "SIMULACRO INTRUSION", area: "PRODUCCIÓN", horaInicio: "10:00", supervisor: "Cristian Camilo Salgado", aspectos: intrusion([3, 3, 3, 3, 3]), conclusion: "El simulacro cumplió el objetivo; se demostró eficacia de controles de acceso e identificación de personas no autorizadas.", desarrollo: "Simulacro histórico importado desde el informe P02602. La intrusión fue detectada oportunamente por el supervisor." },
  { consecutivo: "SIM-P0-2026-003", fecha: new Date("2026-04-14T11:00:00.000Z"), tipo: "SIMULACRO PAQUETE SOSPECHOSO", area: "ÁREA ADMINISTRATIVA", horaInicio: "06:00", supervisor: "Javier Serna Vargas", aspectos: paquete([3, 3, 3, 3, 3]), conclusion: "El personal aplicó correctamente el procedimiento de manejo de correspondencia y paquete sospechoso, informó de inmediato y solicitó evacuar el área.", desarrollo: "Simulacro histórico importado desde el informe PO2603. El paquete fue detectado y reportado en el tiempo estimado." },
  { consecutivo: "SIM-P0-2026-004", fecha: new Date("2026-08-25T13:00:00.000Z"), tipo: "SIMULACRO HURTO", area: "ALMACÉN", horaInicio: "08:00", supervisor: "Ivan Dario Mora Cardenas", aspectos: hurto([3, 2, 3, 3, 3]), conclusion: "El personal de almacén se mantuvo alerta e intervino oportunamente, demostrando efectividad del control de vigilancia y cultura de seguridad.", desarrollo: "Simulacro histórico importado desde el informe PO2604. La reacción del personal permitió detectar y controlar la situación de inmediato." },
];

function promedio(aspectos: Aspecto[]) { const puntos: Record<number, number> = { 3: 1, 2: 0.5, 1: 0 }; return aspectos.reduce((total, aspecto) => total + puntos[aspecto.calificacion], 0) / aspectos.length; }

async function main() {
  let importados = 0;
  for (const registro of registros) {
    if (await prisma.simulacroActividad.findUnique({ where: { consecutivo: registro.consecutivo }, select: { id: true } })) continue;
    const origenId = `HISTORICO-${registro.consecutivo}`;
    if (await prisma.actividadSupervisor.findUnique({ where: { origenId }, select: { id: true } })) continue;
    await prisma.$transaction(async (tx) => {
      const actividad = await tx.actividadSupervisor.create({ data: { origenId, fechaPlaneada: registro.fecha, finca: "P0", actividad: registro.tipo, area: registro.area, supervisorNombre: registro.supervisor, estado: "TERMINADO", fechaCierre: registro.fecha, cumplidaEnFecha: true, cerradoPor: registro.supervisor, observacionesCierre: "Histórico cerrado: simulacro detectado exitosamente.", creadoPor: "Importación histórica", creadoPorCorreo: "historico@falconservice.local", createdAt: registro.fecha } });
      await tx.simulacroActividad.create({ data: { actividadId: actividad.id, tipo: registro.tipo, finca: "P0", area: registro.area, grupoObjeto: `Personal de ${registro.area}`, personasInformadas: "Registro histórico importado", escenario: registro.area, horaInicio: registro.horaInicio, duracionMinutos: 30, consecutivo: registro.consecutivo, guion: "Registro histórico importado desde los formatos de simulacro P0 2026.", resultado: "DETECTADO", cumplimientoObjetivo: registro.conclusion, desarrollo: registro.desarrollo, pasos: [{ descripcion: registro.desarrollo }], aspectos: registro.aspectos, promedioEvaluacion: promedio(registro.aspectos), conclusion: registro.conclusion, requiereSac: false, evidencias: [], creadoPor: registro.supervisor, creadoPorCorreo: "historico@falconservice.local", createdAt: registro.fecha } });
    });
    importados++;
  }
  console.log(JSON.stringify({ total: registros.length, importados }));
}

main().finally(() => prisma.$disconnect());
