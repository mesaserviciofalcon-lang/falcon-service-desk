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

export function mismaFincaActividad(fincaUsuario?: string | null, fincaActividad?: string | null) {
  const normalizar = (valor?: string | null) => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const aliases: Record<string, string> = { FLOPACK: "FPK", FPK: "FPK" };
  const usuario = aliases[normalizar(fincaUsuario)] || normalizar(fincaUsuario);
  const actividad = aliases[normalizar(fincaActividad)] || normalizar(fincaActividad);
  return Boolean(usuario && actividad && usuario === actividad);
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

function partesFechaColombia(fecha: Date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(fecha);
  return Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
}

/** Ventana habilitada desde el día 25 para programar el mes siguiente. */
export function ventanaProgramacionAnalista(referencia = new Date()) {
  const partes = partesFechaColombia(referencia);
  const ano = Number(partes.year);
  const mes = Number(partes.month);
  const dia = Number(partes.day);
  const anoDestino = mes === 12 ? ano + 1 : ano;
  const mesDestino = mes === 12 ? 1 : mes + 1;
  const inicioMesActual = new Date(Date.UTC(ano, mes - 1, 1, 5));
  const inicioVentana = new Date(Date.UTC(ano, mes - 1, 25, 5));
  const inicioMesDestino = new Date(Date.UTC(anoDestino, mesDestino - 1, 1, 5));
  const finMesDestino = new Date(Date.UTC(anoDestino, mesDestino, 1, 5));
  const ultimoDiaVentana = new Date(inicioMesDestino);
  ultimoDiaVentana.setUTCDate(ultimoDiaVentana.getUTCDate() - 1);
  return {
    abierta: dia >= 25,
    inicioVentana,
    inicioMesActual,
    inicioMesDestino,
    finMesDestino,
    etiquetaMes: new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", month: "long", year: "numeric" }).format(inicioMesDestino),
    etiquetaMesActual: new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", month: "long", year: "numeric" }).format(inicioMesActual),
    etiquetaUltimoDiaVentana: new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "long", year: "numeric" }).format(ultimoDiaVentana),
  };
}

export function fechaProgramadaConservandoHora(fechaOriginal: Date, fechaNueva: string) {
  const coincidencia = fechaNueva.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!coincidencia) return null;
  const horaOriginal = partesFechaColombia(fechaOriginal);
  return new Date(Date.UTC(Number(coincidencia[1]), Number(coincidencia[2]) - 1, Number(coincidencia[3]), Number(horaOriginal.hour) + 5, Number(horaOriginal.minute)));
}

function fechaActividad(fecha: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(fecha);
}

function fechaSoloActividad(fecha: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "full",
    timeZone: "America/Bogota",
  }).format(fecha);
}

function horaActividad(fecha: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(fecha);
}

type ActividadRecordatorio = {
  id: number;
  actividad: string;
  finca: string;
  area: string | null;
  fechaPlaneada: Date;
  supervisorNombre: string | null;
};

function filasRecordatorioActividades(
  actividades: ActividadRecordatorio[],
  incluirSupervisor = false
) {
  return actividades.map((actividad) => `
    <tr>
      <td style="padding:8px;border:1px solid #d1d5db">${fechaSoloActividad(actividad.fechaPlaneada)}</td>
      <td style="padding:8px;border:1px solid #d1d5db">${horaActividad(actividad.fechaPlaneada)}</td>
      <td style="padding:8px;border:1px solid #d1d5db">${actividad.finca}</td>
      <td style="padding:8px;border:1px solid #d1d5db">${actividad.actividad}</td>
      <td style="padding:8px;border:1px solid #d1d5db">${actividad.area || "Sin área"}</td>
      ${incluirSupervisor ? `<td style="padding:8px;border:1px solid #d1d5db">${actividad.supervisorNombre || "Sin asignar"}</td>` : ""}
    </tr>
  `).join("");
}

function tablaRecordatorioActividades(
  actividades: ActividadRecordatorio[],
  incluirSupervisor = false
) {
  return `
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      <thead>
        <tr>
          <th style="padding:8px;border:1px solid #d1d5db;text-align:left">Fecha</th>
          <th style="padding:8px;border:1px solid #d1d5db;text-align:left">Hora</th>
          <th style="padding:8px;border:1px solid #d1d5db;text-align:left">Finca</th>
          <th style="padding:8px;border:1px solid #d1d5db;text-align:left">Actividad</th>
          <th style="padding:8px;border:1px solid #d1d5db;text-align:left">Área</th>
          ${incluirSupervisor ? '<th style="padding:8px;border:1px solid #d1d5db;text-align:left">Supervisor</th>' : ""}
        </tr>
      </thead>
      <tbody>${filasRecordatorioActividades(actividades, incluirSupervisor)}</tbody>
    </table>
  `;
}

export function recordatorioActividadesSupervisorTemplate({
  supervisor,
  actividades,
}: {
  supervisor: string;
  actividades: ActividadRecordatorio[];
}) {
  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5">
      <h2 style="color:#0F3D1F">Recordatorio de actividades programadas</h2>
      <p>Buen día, ${supervisor}.</p>
      <p>Mañana tiene ${actividades.length === 1 ? "una actividad programada" : `${actividades.length} actividades programadas`}. Ingrese a la plataforma para gestionarlas y registrar la evidencia del cierre.</p>
      ${tablaRecordatorioActividades(actividades)}
      <p style="margin-top:24px"><a href="${getAppUrl()}/actividades-supervisores" style="background:#0F3D1F;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Ver mis actividades</a></p>
    </div>
  `;
}

export function recordatorioActividadesAnalistaTemplate({
  analista,
  actividades,
}: {
  analista: string;
  actividades: ActividadRecordatorio[];
}) {
  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5">
      <h2 style="color:#0F3D1F">Visita de Seguridad programada</h2>
      <p>Buen día, ${analista}.</p>
      <p>Mañana tendrá la visita del personal de Seguridad, a cargo del supervisor asignado, en su finca.</p>
      ${tablaRecordatorioActividades(actividades, true)}
    </div>
  `;
}

export function recordatorioActividadesJefeTemplate({
  actividades,
}: {
  actividades: ActividadRecordatorio[];
}) {
  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5">
      <h2 style="color:#0F3D1F">Programación de supervisores para mañana</h2>
      <p>Los siguientes supervisores están programados para realizar actividades en las fincas indicadas:</p>
      ${tablaRecordatorioActividades(actividades, true)}
    </div>
  `;
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

export function recordatorioProgramacionActividadesTemplate({ analista, actividades, etiquetaMes, etiquetaVentana, etiquetaUltimoDiaVentana }: { analista: string; etiquetaMes: string; etiquetaVentana: string; etiquetaUltimoDiaVentana: string; actividades: Array<{ actividad: string; finca: string; area: string | null; fechaPlaneada: Date }>; }) {
  const filas = actividades.map((actividad) => `<tr><td style="padding:8px;border:1px solid #d1d5db">${actividad.actividad}</td><td style="padding:8px;border:1px solid #d1d5db">${actividad.finca}</td><td style="padding:8px;border:1px solid #d1d5db">${actividad.area || "Sin área"}</td><td style="padding:8px;border:1px solid #d1d5db">${fechaActividad(actividad.fechaPlaneada)}</td></tr>`).join("");
  return `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5"><h2 style="color:#0F3D1F">Programación de actividades pendiente</h2><p>Buen día, ${analista}.</p><p>La programación de las actividades de <strong>${etiquetaMes}</strong> está disponible desde el 25 de <strong>${etiquetaVentana}</strong> hasta el <strong>${etiquetaUltimoDiaVentana}</strong>. Ingrese a la plataforma para confirmar o ajustar únicamente el área y la fecha planeada. Si no realiza la programación, se conservarán las fechas y áreas establecidas por Seguridad.</p><table style="border-collapse:collapse;width:100%;font-size:14px"><thead><tr><th style="padding:8px;border:1px solid #d1d5db;text-align:left">Actividad</th><th style="padding:8px;border:1px solid #d1d5db;text-align:left">Finca</th><th style="padding:8px;border:1px solid #d1d5db;text-align:left">Área estimada</th><th style="padding:8px;border:1px solid #d1d5db;text-align:left">Fecha estimada</th></tr></thead><tbody>${filas}</tbody></table><p style="margin-top:24px"><a href="${getAppUrl()}/programacion-actividades" style="background:#0F3D1F;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Ingresar a programación de actividades</a></p></div>`;
}
