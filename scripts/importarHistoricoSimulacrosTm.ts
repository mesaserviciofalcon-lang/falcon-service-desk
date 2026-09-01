import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type RegistroHistorico = {
  consecutivo: string;
  fecha: Date;
  tipo: "SIMULACRO HURTO" | "SIMULACRO INTRUSION" | "SIMULACRO PAQUETE SOSPECHOSO" | "SIMULACRO CONTAMINACION";
  area: string;
  horaInicio: string;
  supervisor: string;
  resultado: "DETECTADO" | "NO DETECTADO";
  aspectos: Array<{ nombre: string; calificacion: number }>;
  conclusion: string;
  desarrollo: string;
};

const hurto = (calificaciones: number[]) => [
  "Reporte de actividades sospechosas",
  "Controles de acceso",
  "Identificación de personas mediante el carné",
  "Cultura de seguridad",
  "Activación del plan de emergencia para los riesgos asociados",
].map((nombre, indice) => ({ nombre, calificacion: calificaciones[indice] }));

const intrusion = hurto;

const paquete = (calificaciones: number[]) => [
  "Reporte de actividades subestándar y detección temprana de paquetes sospechosos",
  "Plan de contingencia",
  "Cultura de seguridad",
  "Aseguramiento del área",
  "Activación del plan de emergencia para los riesgos asociados",
].map((nombre, indice) => ({ nombre, calificacion: calificaciones[indice] }));

const contaminacion = (calificaciones: number[]) => [
  "Conocimiento y aplicación de procedimientos ante actividades sospechosas",
  "Identificación e inspección del material de empaque",
  "Aseguramiento de áreas de trabajo",
  "Activación del plan de emergencia para los riesgos asociados",
].map((nombre, indice) => ({ nombre, calificacion: calificaciones[indice] }));

const registros: RegistroHistorico[] = [
  {
    consecutivo: "SIM-TM-2026-001", fecha: new Date("2026-01-08T14:00:00.000Z"), tipo: "SIMULACRO HURTO", area: "CASETA MIRFE", horaInicio: "09:00", supervisor: "Jose Reinel Perez Peña", resultado: "DETECTADO", aspectos: hurto([3, 3, 3, 3, 3]),
    conclusion: "Se evidencia que el personal del área tiene claro el procedimiento de control de acceso e identificación de personas en áreas restringidas.",
    desarrollo: "Simulacro histórico importado desde el informe TM2601. El ejercicio fue detectado y se realizó la retroalimentación correspondiente.",
  },
  {
    consecutivo: "SIM-TM-2026-002", fecha: new Date("2026-02-19T16:00:00.000Z"), tipo: "SIMULACRO CONTAMINACION", area: "EMPAQUE", horaInicio: "11:00", supervisor: "Javier Serna Vargas", resultado: "NO DETECTADO", aspectos: contaminacion([1, 1, 1, 1]),
    conclusion: "El personal de empaque no detectó los ramos contaminados ni realizó inspección visual y detallada del material. Se gestionó y cerró por el procedimiento anterior.",
    desarrollo: "Simulacro histórico importado desde el informe TM2602. Se realizó retroalimentación sobre la inspección del material de empaque.",
  },
  {
    consecutivo: "SIM-TM-2026-003", fecha: new Date("2026-03-24T15:00:00.000Z"), tipo: "SIMULACRO PAQUETE SOSPECHOSO", area: "OFICINA DIRECCIÓN DE GESTIÓN HUMANA", horaInicio: "10:00", supervisor: "Jose Reinel Perez Peña", resultado: "DETECTADO", aspectos: paquete([3, 3, 3, 3, 3]),
    conclusion: "Se evidencia eficacia en la detección del paquete sospechoso, el reporte de actividades subestándar y la activación del plan de contingencia.",
    desarrollo: "Simulacro histórico importado desde el informe TM2603. El paquete fue detectado, reportado y se activó el plan de contingencia.",
  },
  {
    consecutivo: "SIM-TM-2026-004", fecha: new Date("2026-04-20T14:00:00.000Z"), tipo: "SIMULACRO INTRUSION", area: "CUARTO TALLER DE MANTENIMIENTO", horaInicio: "09:00", supervisor: "Javier Serna Vargas", resultado: "DETECTADO", aspectos: intrusion([3, 3, 3, 3, 3]),
    conclusion: "Se evidencia que el personal del área tiene claro el procedimiento de control de acceso e identificación de personas en áreas restringidas.",
    desarrollo: "Simulacro histórico importado desde el informe TM2604. El intento de ingreso fue detectado y se activó la alerta prevista.",
  },
  {
    consecutivo: "SIM-TM-2026-005", fecha: new Date("2026-05-08T14:00:00.000Z"), tipo: "SIMULACRO HURTO", area: "OFICINAS GH", horaInicio: "09:00", supervisor: "Sebastian Yunda Rodriguez", resultado: "NO DETECTADO", aspectos: hurto([1, 1, 1, 1, 2]),
    conclusion: "El resultado histórico quedó gestionado y cerrado bajo el procedimiento anterior.",
    desarrollo: "Simulacro histórico importado desde el informe TM2605. Se registró la retroalimentación correspondiente según el proceso anterior.",
  },
  {
    consecutivo: "SIM-TM-2026-006", fecha: new Date("2026-06-10T16:00:00.000Z"), tipo: "SIMULACRO CONTAMINACION", area: "EMPAQUE", horaInicio: "11:00", supervisor: "Jose Reinel Perez Peña", resultado: "DETECTADO", aspectos: contaminacion([3, 3, 3, 3]),
    conclusion: "El personal de empaque detectó la caja contaminada gracias a una buena inspección del material y al conocimiento de los riesgos asociados.",
    desarrollo: "Simulacro histórico importado desde el informe TM2606. Se detectó el elemento y se efectuó la retroalimentación final.",
  },
  {
    consecutivo: "SIM-TM-2026-007", fecha: new Date("2026-07-21T15:00:00.000Z"), tipo: "SIMULACRO PAQUETE SOSPECHOSO", area: "DIRECCIÓN DE GESTIÓN HUMANA", horaInicio: "10:00", supervisor: "Sebastian Yunda Rodriguez", resultado: "DETECTADO", aspectos: paquete([3, 3, 3, 3, 3]),
    conclusion: "Se evidencia eficacia en la detección del paquete sospechoso, el reporte y la activación del plan de contingencia.",
    desarrollo: "Simulacro histórico importado desde el informe TM2607. El paquete fue detectado, reportado y se activó el plan de contingencia.",
  },
  {
    consecutivo: "SIM-TM-2026-008", fecha: new Date("2026-08-20T14:30:00.000Z"), tipo: "SIMULACRO HURTO", area: "OFICINAS PRINCIPALES", horaInicio: "09:30", supervisor: "Ivan Dario Mora Cardenas", resultado: "DETECTADO", aspectos: hurto([3, 2, 2, 3, 3]),
    conclusion: "El personal de Oficinas Principales evidenció cultura de seguridad, alerta ante personas extrañas y claridad sobre el canal de reporte al Analista SIG.",
    desarrollo: "Simulacro histórico importado desde el informe TM2608. La intervención oportuna del colaborador frustró la simulación de hurto en su fase inicial.",
  },
];

function promedio(aspectos: RegistroHistorico["aspectos"]) {
  const puntos: Record<number, number> = { 3: 1, 2: 0.5, 1: 0 };
  return aspectos.reduce((total, aspecto) => total + puntos[aspecto.calificacion], 0) / aspectos.length;
}

async function main() {
  let importados = 0;
  for (const registro of registros) {
    const existe = await prisma.simulacroActividad.findUnique({ where: { consecutivo: registro.consecutivo }, select: { id: true } });
    if (existe) continue;
    const origenId = `HISTORICO-${registro.consecutivo}`;
    const actividadExistente = await prisma.actividadSupervisor.findUnique({ where: { origenId } });
    if (actividadExistente) continue;
    const valorPromedio = promedio(registro.aspectos);
    await prisma.$transaction(async (tx) => {
      const actividad = await tx.actividadSupervisor.create({ data: {
        origenId, fechaPlaneada: registro.fecha, finca: "TM", actividad: registro.tipo, area: registro.area,
        supervisorNombre: registro.supervisor, estado: "TERMINADO", fechaCierre: registro.fecha, cumplidaEnFecha: true,
        cerradoPor: registro.supervisor, creadoPor: "Importación histórica", creadoPorCorreo: "historico@falconservice.local", createdAt: registro.fecha,
      } });
      await tx.simulacroActividad.create({ data: {
        actividadId: actividad.id, tipo: registro.tipo, finca: "TM", area: registro.area, grupoObjeto: `Personal de ${registro.area}`,
        personasInformadas: "Registro histórico importado", escenario: registro.area, horaInicio: registro.horaInicio, duracionMinutos: 30,
        consecutivo: registro.consecutivo, guion: "Registro histórico importado desde los formatos de simulacro TM 2026.", resultado: registro.resultado,
        cumplimientoObjetivo: registro.conclusion, desarrollo: registro.desarrollo, pasos: [{ descripcion: registro.desarrollo }], aspectos: registro.aspectos,
        promedioEvaluacion: valorPromedio, conclusion: registro.conclusion, requiereSac: false, evidencias: [], creadoPor: registro.supervisor,
        creadoPorCorreo: "historico@falconservice.local", createdAt: registro.fecha,
      } });
    });
    importados++;
  }
  console.log(JSON.stringify({ total: registros.length, importados }));
}

main().finally(() => prisma.$disconnect());
