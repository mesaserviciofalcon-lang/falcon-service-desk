"use client";

import Link
from "next/link";

import {

  LayoutDashboard,

  ClipboardList,

  Ticket,

  BarChart3,

} from "lucide-react";

export default function Sidebar({

  role,

}: {

  role: string;

}) {

  return (

    <div className="w-64 min-h-screen bg-[#0F3D1F] text-white flex flex-col justify-between">

      <div>

        {/* LOGO */}

        <div className="flex flex-col items-center pt-6 pb-4 border-b border-green-900">

          <img

            src="/logo-falcon.png"

            alt="Falcon"

            className="w-32 h-32 object-cover rounded-full bg-white shadow-lg"
          />

          <h1 className="mt-4 text-xl font-bold text-center">

            Falcon Service Desk

          </h1>

          <p className="text-sm text-green-200 mt-1">

            Security Department

          </p>

        </div>

        {/* MENU */}

        <nav className="flex flex-col gap-2 p-4">

          <Link

            href="/dashboard"

            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2FAE4A] transition"
          >

            <LayoutDashboard size={20} />

            Dashboard

          </Link>

          <Link

            href="/solicitudes"

            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2FAE4A] transition"
          >

            <ClipboardList size={20} />

            Solicitudes

          </Link>

          <Link

            href="/tickets"

            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2FAE4A] transition"
          >

            <Ticket size={20} />

            Tickets

          </Link>
      

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