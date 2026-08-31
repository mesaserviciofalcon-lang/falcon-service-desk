import { getAppUrl } from "@/lib/appUrl";

export const estadosActividad = {
  PENDIENTE_ASIGNAR: "Pendiente por asignar",
  ASIGNADO: "Asignado",
  TERMINADO: "Terminado",
} as const;

export const fincasActividad = ["AJ", "GB", "SZ", "AB", "LN", "TM", "LC", "IB", "I4", "LV", "ADM", "FPK", "CORONEL SIZA", "CARLOS BOSHELL", "FISCAL PTE PIEDRA", "FISIOS", "P0"];

export const tiposActividad = ["SIMULACRO CONTAMINACION", "SIMULACRO HURTO", "SIMULACRO PAQUETE SOSPECHOSO", "SIMULACRO INTRUSION", "PRUEBAS ALCOHOLIMETRIA", "INSPECCION PUESTRO DE TRABAJO", "ESTUDIO DE SEGURIDAD", "INVENTARIO DE LLLAVES", "ACTAS COMUNICACIONES", "ACTAS CANINOS", "ACTAS ARMAMENTO", "CAMBIO FORRO CHALECO", "HORAS EXTRAS 1RA QUINCENA", "HORAS EXTRAS 2DA QUINCENA", "ASEO ARMAMENTO", "ACTA ELEMENTOS DE OFICINA", "ENTREGAR FLOR", "RECOGER EFECTIVO", "VERIFICACIÓN DESPACHOS"];

export const areasActividad = ["POSCOSECHA", "INGRESO PERSONAL", "PRODUCCION", "SG-SST", "ADMINISTRACION", "MIPE", "MIRFE", "MANTENIMIENTO", "ALMACEN", "CONTRATISTAS", "FINCAS", "FINCAS OCCIDENTE", "FINCAS NORTE", "OFICINA GB", "CUARTO FRIO DE RECEPCIÓN", "LOCKERS", "CASA", "CONSULTORIO"];

export function puedeAdministrarActividades(
  rol?: string | null
) {
  return ["ADMIN", "JEFE_SEG"].includes(
    String(rol || "")
  );
}

export function puedeVerMetricasActividades(
  rol?: string | null
) {
  return ["ADMIN", "JEFE_SEG", "SUPERVISOR"].includes(
    String(rol || "")
  );
}

export function normalizarCorreo(
  correo?: string | null
) {
  return String(correo || "")
    .trim()
    .toLowerCase();
}

export function urlActividad(id: number) {
  return `${getAppUrl()}/login?redirect=/actividades-supervisores/${id}`;
}

export function fechaHoraColombiaDesdeInput(valor: string) {
  const partes = valor.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!partes) return null;
  return new Date(Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]), Number(partes[4]) + 5, Number(partes[5])));
}

export function inicioDiaColombia(fecha: Date) {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(fecha);
  const valor = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return new Date(Date.UTC(Number(valor.year), Number(valor.month) - 1, Number(valor.day), 5));
}

function fechaActividad(fecha: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(fecha);
}

export function recordatorioActividadTemplate({
  actividad,
}: {
  actividad: {
    id: number;
    actividad: string;
    finca: string;
    area: string | null;
    fechaPlaneada: Date;
    supervisorNombre: string | null;
  };
}) {
  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5">
      <h2 style="color:#0F3D1F">Recordatorio de actividad programada</h2>
      <p>Buen día, ${actividad.supervisorNombre || "Supervisor"}.</p>
      <p>Tiene una actividad programada para mañana. Ingrese a la plataforma para gestionarla y registrar su evidencia.</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        <tr><td style="padding:8px;border:1px solid #d1d5db"><strong>Actividad</strong></td><td style="padding:8px;border:1px solid #d1d5db">${actividad.actividad}</td></tr>
        <tr><td style="padding:8px;border:1px solid #d1d5db"><strong>Finca</strong></td><td style="padding:8px;border:1px solid #d1d5db">${actividad.finca}</td></tr>
        <tr><td style="padding:8px;border:1px solid #d1d5db"><strong>Área</strong></td><td style="padding:8px;border:1px solid #d1d5db">${actividad.area || "Sin área"}</td></tr>
        <tr><td style="padding:8px;border:1px solid #d1d5db"><strong>Fecha</strong></td><td style="padding:8px;border:1px solid #d1d5db">${fechaActividad(actividad.fechaPlaneada)}</td></tr>
      </table>
      <p style="margin-top:24px"><a href="${urlActividad(actividad.id)}" style="background:#0F3D1F;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Gestionar actividad</a></p>
    </div>
  `;
}

export function incumplimientoActividadTemplate({
  actividad,
}: {
  actividad: {
    id: number;
    actividad: string;
    finca: string;
    fechaPlaneada: Date;
    supervisorNombre: string | null;
  };
}) {
  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5">
      <h2 style="color:#b91c1c">Actividad pendiente de cumplimiento</h2>
      <p>La siguiente actividad no fue cerrada en la fecha programada y continúa pendiente.</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        <tr><td style="padding:8px;border:1px solid #d1d5db"><strong>Actividad</strong></td><td style="padding:8px;border:1px solid #d1d5db">${actividad.actividad}</td></tr>
        <tr><td style="padding:8px;border:1px solid #d1d5db"><strong>Supervisor</strong></td><td style="padding:8px;border:1px solid #d1d5db">${actividad.supervisorNombre || "Sin asignar"}</td></tr>
        <tr><td style="padding:8px;border:1px solid #d1d5db"><strong>Finca</strong></td><td style="padding:8px;border:1px solid #d1d5db">${actividad.finca}</td></tr>
        <tr><td style="padding:8px;border:1px solid #d1d5db"><strong>Fecha programada</strong></td><td style="padding:8px;border:1px solid #d1d5db">${fechaActividad(actividad.fechaPlaneada)}</td></tr>
      </table>
      <p style="margin-top:24px"><a href="${urlActividad(actividad.id)}" style="background:#0F3D1F;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Ver actividad</a></p>
    </div>
  `;
}
