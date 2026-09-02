"use client";

import Link from "next/link";
import Image from "next/image";
import { type ReactNode, useState } from "react";
import { AlertTriangle, BarChart3, CalendarDays, ChevronDown, ClipboardList, FileText, ImageIcon, LayoutDashboard, MapPinned, Network, ShieldCheck, TableProperties, Ticket, Users } from "lucide-react";

import { esAnalistaSig, puedeVerVulnerabilidades } from "@/lib/permisosUsuarios";
import { puedeConsultarVisitas } from "@/lib/permisosVisitas";
import { puedeVerAnuario, puedeVerOrganigramaSeguridad } from "@/lib/permisosAnuario";

type ItemProps = { href: string; icon: ReactNode; children: ReactNode };

function SubmenuItem({ href, icon, children }: ItemProps) {
  return <Link href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-green-50 transition hover:bg-[#2FAE4A]"><span className="shrink-0">{icon}</span>{children}</Link>;
}

function MenuGroup({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  return <div><button type="button" onClick={() => setAbierto((actual) => !actual)} aria-expanded={abierto} className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-[#2FAE4A]"><span className="shrink-0">{icon}</span><span className="flex-1">{title}</span><ChevronDown size={18} className={`transition-transform ${abierto ? "rotate-180" : ""}`} /></button>{abierto && <div className="ml-5 border-l border-green-700 py-1 pl-2">{children}</div>}</div>;
}

export default function Sidebar({ role, cargo, nombre }: { role: string; cargo?: string; nombre?: string }) {
  const puedeVerAntecedentes = role !== "TECNICO";
  const puedeVerVisitas = puedeConsultarVisitas(cargo);
  const puedeGestionMasiva = ["ADMIN", "DIRECTOR_SEG", "JEFE_SEG", "SUPERVISOR"].includes(role);
  const puedeVerVulnerabilidad = puedeVerVulnerabilidades(role, cargo);
  const puedeVerMetricasVulnerabilidad = role === "ADMIN" || esAnalistaSig(cargo);
  const puedeVerActividades = ["ADMIN", "JEFE_SEG", "SUPERVISOR"].includes(role);
  const puedeProgramarActividades = esAnalistaSig(cargo) || role === "ADMIN";
  const puedeVerMetricasActividades = ["ADMIN", "JEFE_SEG", "SUPERVISOR"].includes(role);
  const puedeVerSimulacros = ["ADMIN", "JEFE_SEG", "DIRECTOR_SEG"].includes(role) || esAnalistaSig(cargo);
  const puedeVerMetricasSimulacros = ["ADMIN", "JEFE_SEG", "DIRECTOR_SEG"].includes(role) || esAnalistaSig(cargo);
  const puedeVerEquipo = puedeVerAnuario({ rol: role, cargo, nombre });
  const puedeVerOrganigrama = puedeVerOrganigramaSeguridad({ rol: role });

  return <div className="flex min-h-screen w-64 flex-col justify-between bg-[#0F3D1F] text-white"><div><Link href="/dashboard" className="flex flex-col items-center border-b border-green-900 pb-5 pt-8"><Image src="/logo-falcon.png" alt="Falcon" width={160} height={160} className="h-40 w-40 rounded-full bg-white object-cover shadow-lg" priority /><h1 className="mt-2 text-center text-xl font-bold">Falcon Service Desk</h1><p className="text-sm text-green-200">Security Department</p></Link><nav className="flex flex-col gap-1 p-4"><Link href="/dashboard" className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-[#2FAE4A]"><LayoutDashboard size={20} />Dashboard</Link>{role !== "TECNICO" && <Link href="/solicitudes" className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-[#2FAE4A]"><ClipboardList size={20} />Solicitudes</Link>}<Link href="/tickets" className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-[#2FAE4A]"><Ticket size={20} />Tickets</Link>{puedeGestionMasiva && <Link href="/antecedentes/gestion-masiva" className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-[#2FAE4A]"><TableProperties size={20} />Gestión masiva</Link>}
      {(puedeVerAntecedentes || puedeVerVisitas) && <MenuGroup icon={<ShieldCheck size={20} />} title="Consultas Seguridad">{puedeVerAntecedentes && <SubmenuItem href="/antecedentes" icon={<ShieldCheck size={18} />}>Antecedentes</SubmenuItem>}{puedeVerVisitas && <SubmenuItem href="/visitas" icon={<MapPinned size={18} />}>Consulta visitas</SubmenuItem>}</MenuGroup>}
      {(puedeVerVulnerabilidad || puedeVerMetricasVulnerabilidad) && <MenuGroup icon={<AlertTriangle size={20} />} title="Análisis de vulnerabilidad">{puedeVerVulnerabilidad && <SubmenuItem href="/vulnerabilidades" icon={<AlertTriangle size={18} />}>Vulnerabilidades</SubmenuItem>}{puedeVerMetricasVulnerabilidad && <SubmenuItem href="/vulnerabilidades/metricas" icon={<BarChart3 size={18} />}>Métricas análisis</SubmenuItem>}</MenuGroup>}
      {(puedeVerActividades || puedeProgramarActividades || puedeVerMetricasActividades) && <MenuGroup icon={<CalendarDays size={20} />} title="Actividades">{puedeVerActividades && <SubmenuItem href="/actividades-supervisores" icon={<CalendarDays size={18} />}>Actividades supervisores</SubmenuItem>}{puedeProgramarActividades && <SubmenuItem href="/programacion-actividades" icon={<CalendarDays size={18} />}>Programación actividades</SubmenuItem>}{puedeVerMetricasActividades && <SubmenuItem href="/actividades-supervisores/metricas" icon={<BarChart3 size={18} />}>Métricas actividades</SubmenuItem>}</MenuGroup>}
      {(puedeVerSimulacros || puedeVerMetricasSimulacros) && <MenuGroup icon={<FileText size={20} />} title="Simulacros">{puedeVerSimulacros && <SubmenuItem href="/simulacros" icon={<FileText size={18} />}>Simulacros</SubmenuItem>}{puedeVerMetricasSimulacros && <SubmenuItem href="/simulacros/metricas" icon={<BarChart3 size={18} />}>Métricas simulacros</SubmenuItem>}</MenuGroup>}
      {puedeVerEquipo && <Link href="/equipo-administrativo" className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-[#2FAE4A]"><ImageIcon size={20} />Equipo administrativo</Link>}
      {(role === "ADMIN" || puedeVerOrganigrama) && <MenuGroup icon={<Users size={20} />} title="Administración">{role === "ADMIN" && <SubmenuItem href="/usuarios" icon={<Users size={18} />}>Gestión de usuarios</SubmenuItem>}{puedeVerOrganigrama && <SubmenuItem href="/organigrama-seguridad" icon={<Network size={18} />}>Organigrama Seguridad</SubmenuItem>}</MenuGroup>}
    </nav></div><div className="border-t border-green-900 p-4 text-center"><p className="text-xs text-green-200">Powered by GRT</p><p className="text-xs text-green-300">Gerat Technology</p></div></div>;
}
