"use client";

import Link
from "next/link";

import {

  LayoutDashboard,

  ClipboardList,

  Ticket,

  ShieldCheck,

  Camera,

  Radio,

  UserSearch,

  FileWarning,

  Users,

  TableProperties,

  MapPinned,

  AlertTriangle,

  BarChart3,

  ImageIcon,

  Network,

  CalendarDays,
  FileText,

} from "lucide-react";

import {
  puedeVerVulnerabilidades,
} from "@/lib/permisosUsuarios";

import { puedeConsultarVisitas }
from "@/lib/permisosVisitas";

import { puedeVerAnuario }
from "@/lib/permisosAnuario";

import { puedeVerOrganigramaSeguridad }
from "@/lib/permisosAnuario";

export default function Sidebar({

  role,

  cargo,

  nombre,

}: {

  role: string;

  cargo?: string;

  nombre?: string;

}) {

  return (

    <div className="w-64 min-h-screen bg-[#0F3D1F] text-white flex flex-col justify-between">

      <div>

        {/* LOGO */}

        <Link
  href="/dashboard"
  className="
  flex
  flex-col
  items-center
  pt-8
  pb-5
  border-b
  border-green-900
"
>

          <img

            src="/logo-falcon.png"

            alt="Falcon"

            className="w-40 h-40 object-cover rounded-full bg-white shadow-lg"
          />

          <h1 className="mt-2 text-xl font-bold text-center">

            Falcon Service Desk

          </h1>

          <p className="text-sm text-green-200">

            Security Department

          </p>

        </Link>

{/* MENU */}

        <nav className="flex flex-col gap-2 p-4">

          {/* DASHBOARD */}

          <Link

            href="/dashboard"

            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2FAE4A] transition"
          >

            <LayoutDashboard size={20} />

            Dashboard

          </Link>

          {/* SOLICITUDES */}

          {role !== "TECNICO" && (
            <Link

              href="/solicitudes"

              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2FAE4A] transition"
            >

              <ClipboardList size={20} />

              Solicitudes

            </Link>
          )}

          {/* TICKETS */}

          <Link

            href="/tickets"

            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2FAE4A] transition"
          >

            <Ticket size={20} />

            Tickets

          </Link>

          {role !== "TECNICO" && (
            <Link

              href="/antecedentes"

              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2FAE4A] transition"
            >

              <ShieldCheck size={20} />

              Antecedentes

            </Link>
          )}

          {puedeConsultarVisitas(cargo) && (

            <Link

              href="/visitas"

              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2FAE4A] transition"
            >

              <MapPinned size={20} />

              Consulta visitas

            </Link>
          )}

          {[
            "ADMIN",
            "DIRECTOR_SEG",
            "JEFE_SEG",
            "SUPERVISOR",
          ].includes(role) && (

            <Link
              href="/antecedentes/gestion-masiva"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2FAE4A] transition"
            >

              <TableProperties size={20} />

              Gestion masiva

            </Link>
          )}

          {puedeVerVulnerabilidades(
            role,
            cargo
          ) && (

            <Link
              href="/vulnerabilidades"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2FAE4A] transition"
            >

              <AlertTriangle size={20} />

              Vulnerabilidades

            </Link>
          )}

          {puedeVerAnuario({
            rol: role,
            cargo,
            nombre,
          }) && (
            <Link
              href="/equipo-administrativo"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2FAE4A] transition"
            >
              <ImageIcon size={20} />
              Equipo administrativo
            </Link>
          )}

          {puedeVerOrganigramaSeguridad({
            rol: role,
          }) && (
            <Link
              href="/organigrama-seguridad"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2FAE4A] transition"
            >
              <Network size={20} />
              Organigrama Seguridad
            </Link>
          )}

          {["ADMIN", "JEFE_SEG", "SUPERVISOR"].includes(role) && (
            <Link
              href="/actividades-supervisores"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2FAE4A] transition"
            >
              <CalendarDays size={20} />
              Actividades supervisores
            </Link>
          )}

          {(["ADMIN", "JEFE_SEG", "DIRECTOR_SEG"].includes(role) || cargo === "ANALISTA SIG") && (
            <Link href="/simulacros" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2FAE4A] transition">
              <FileText size={20} />
              Simulacros
            </Link>
          )}

          {["ADMIN", "JEFE_SEG", "SUPERVISOR"].includes(role) && (
            <Link
              href="/actividades-supervisores/metricas"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2FAE4A] transition"
            >
              <BarChart3 size={20} />
              Métricas actividades
            </Link>
          )}

          {/* ADMIN */}

          {role === "ADMIN" && (

            <>

              <div className="border-t border-green-800 my-3" />

              <p className="text-xs text-green-300 uppercase px-3">

                Administración

              </p>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#14532d]">

                <ShieldCheck size={20} />

                Acceso total

              </div>

              <Link

                href="/usuarios"

                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2FAE4A] transition"
              >

                <Users size={20} />

              Gestion de usuarios

              </Link>

              <Link

                href="/vulnerabilidades/metricas"

                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2FAE4A] transition"
              >

                <BarChart3 size={20} />

                Metricas analisis

              </Link>

            </>
          )}

          {/* TECNICO */}

          {role === "TECNICO" && (

            <>

              <div className="border-t border-green-800 my-3" />

              <p className="text-xs text-green-300 uppercase px-3">

                Área Técnica

              </p>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#14532d]">

                <Camera size={20} />

                CCTV y Radios

              </div>

            </>
          )}

          {/* VISITA */}

          {role === "VISITA" && (

            <>

              <div className="border-t border-green-800 my-3" />

              <p className="text-xs text-green-300 uppercase px-3">

                Visitas

              </p>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#14532d]">

                <UserSearch size={20} />

                Visita domiciliaria

              </div>

            </>
          )}

          {/* SUPERVISOR */}

          {role === "SUPERVISOR" && (

            <>

              <div className="border-t border-green-800 my-3" />

              <p className="text-xs text-green-300 uppercase px-3">

                Antecedentes

              </p>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#14532d]">

                <ShieldCheck size={20} />

                Estudios de seguridad

              </div>

            </>
          )}

          {/* JEFE SEGURIDAD */}

          {(

            role === "JEFE_SEG"

            ||

            role === "DIRECTOR_SEG"

          ) && (

            <>

              <div className="border-t border-green-800 my-3" />

              <p className="text-xs text-green-300 uppercase px-3">

                Seguridad

              </p>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#14532d]">

                <FileWarning size={20} />

                CCTV, radios y novedades

              </div>

            </>
          )}

        </nav>

      </div>

      {/* FOOTER */}

      <div className="p-4 border-t border-green-900 text-center">

        <p className="text-xs text-green-200">

          Powered by GRT

        </p>

        <p className="text-xs text-green-300">

          Gerat Technology

        </p>

      </div>

    </div>
  );
}
