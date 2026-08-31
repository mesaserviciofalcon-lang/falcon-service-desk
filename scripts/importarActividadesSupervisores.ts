import path from "node:path";

import { PrismaClient } from "@prisma/client";
import XLSX from "xlsx";

const prisma = new PrismaClient();
const archivo = process.argv[2] || path.join(process.env.USERPROFILE || "C:/Users/Cristian Salgado", "Downloads", "Base.xlsx");

function normalizar(valor: unknown) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function fechaExcel(valor: unknown) {
  if (valor instanceof Date) return { year: valor.getFullYear(), month: valor.getMonth() + 1, day: valor.getDate() };
  if (typeof valor === "number") {
    const fecha = XLSX.SSF.parse_date_code(valor);
    if (fecha) return { year: fecha.y, month: fecha.m, day: fecha.d };
  }
  const partes = String(valor || "").match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!partes) return null;
  return { year: partes[3].length === 2 ? 2000 + Number(partes[3]) : Number(partes[3]), month: Number(partes[1]), day: Number(partes[2]) };
}

function horaExcel(valor: unknown) {
  if (valor instanceof Date) return { hour: valor.getHours(), minute: valor.getMinutes() };
  if (typeof valor === "number") {
    const minutos = Math.round((valor % 1) * 24 * 60);
    return { hour: Math.floor(minutos / 60) % 24, minute: minutos % 60 };
  }
  const partes = String(valor || "").trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!partes) return { hour: 8, minute: 0 };
  let hour = Number(partes[1]);
  const sufijo = partes[3]?.toUpperCase();
  if (sufijo === "PM" && hour < 12) hour += 12;
  if (sufijo === "AM" && hour === 12) hour = 0;
  return { hour, minute: Number(partes[2]) };
}

function combinarFechaHora(fecha: unknown, hora: unknown) {
  const dia = fechaExcel(fecha);
  if (!dia) return null;
  const tiempo = horaExcel(hora);
  // Colombia no tiene horario de verano: UTC-5.
  return new Date(Date.UTC(dia.year, dia.month - 1, dia.day, tiempo.hour + 5, tiempo.minute));
}

async function main() {
  const libro = XLSX.readFile(archivo, { cellDates: true });
  const hoja = libro.Sheets.Base;
  if (!hoja) throw new Error('El archivo debe tener una hoja llamada "Base"');
  const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: null, raw: true });
  const supervisores = await prisma.usuario.findMany({
    where: { activo: true, rol: "SUPERVISOR" },
    select: { nombre: true, email: true },
  });
  const porCorreo = new Map(supervisores.map((supervisor) => [supervisor.email.trim().toLowerCase(), supervisor]));
  const porNombre = new Map(supervisores.map((supervisor) => [normalizar(supervisor.nombre), supervisor]));
  const agosto2026 = new Date(Date.UTC(2026, 7, 1, 5));
  const registros = [];
  let pendientesAsignacion = 0;

  for (const [indice, fila] of filas.entries()) {
    const fechaPlaneada = combinarFechaHora(fila["FECHA PLANEADA"], fila["HORA PLANEADA"]);
    const finca = String(fila.FINCA || "").trim();
    const actividad = String(fila.ACTIVIDAD || "").trim();
    if (!fechaPlaneada || !finca || !actividad) continue;

    const correoOriginal = String(fila.CORREO || "").trim().toLowerCase();
    const supervisor = porCorreo.get(correoOriginal) || porNombre.get(normalizar(fila.SUPERVISOR));
    const esHistoricoCerrado = fechaPlaneada < agosto2026;
    const origenId = `appsheet-${String(fila.ID || "sin-id")}-${indice + 2}`;
    const fechaEjecutada = combinarFechaHora(fila["FECHA EJECUTADA"], fila["HORA PLANEADA FIN"]);

    registros.push({
      origenId,
      fechaPlaneada,
      fechaPlaneadaFin: combinarFechaHora(fila["FECHA PLANEADA FIN"], fila["HORA PLANEADA FIN"]),
      finca,
      actividad,
      area: String(fila.AREA || "").trim() || null,
      supervisorNombre: supervisor?.nombre || String(fila.SUPERVISOR || "").trim() || null,
      supervisorCorreo: supervisor?.email || correoOriginal || null,
      estado: esHistoricoCerrado ? "TERMINADO" : supervisor ? "ASIGNADO" : "PENDIENTE_ASIGNAR",
      observacionesCierre: esHistoricoCerrado ? String(fila.OBSERVACIONES || "").trim() || "Cierre histórico importado desde AppSheet" : null,
      fechaCierre: esHistoricoCerrado ? fechaEjecutada || fechaPlaneada : null,
      cerradoPor: esHistoricoCerrado ? "Importación histórica AppSheet" : null,
      cerradoPorCorreo: esHistoricoCerrado ? "importacion@appsheet" : null,
    });
    if (!esHistoricoCerrado && !supervisor) pendientesAsignacion += 1;
  }

  let importadas = 0;
  for (let inicio = 0; inicio < registros.length; inicio += 100) {
    const lote = registros.slice(inicio, inicio + 100);
    const resultado = await prisma.actividadSupervisor.createMany({
      data: lote,
      skipDuplicates: true,
    });
    importadas += resultado.count;
  }
  console.log(`Importación finalizada. Registros nuevos: ${importadas}. Pendientes de asignar: ${pendientesAsignacion}.`);
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
