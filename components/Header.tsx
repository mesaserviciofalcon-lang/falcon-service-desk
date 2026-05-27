"use client";

import Link
from "next/link";

import {

  signOut,

  useSession,

} from "next-auth/react";

export default function Header() {

  const {
    data: session,
  } = useSession();

  return (

    <header className="bg-white shadow-md p-4 flex justify-between items-center">

      <h1 className="text-2xl font-bold text-[#0F3D1F]">

        Mesa de Servicios

      </h1>

      <div className="flex items-center gap-4">

        <div className="text-right">

          <p className="font-semibold">

            {
              session?.user
                ?.name
            }

          </p>

          <p className="text-sm text-gray-500">

            {
              session?.user
                ?.email
            }

          </p>

        </div>

        {/* CAMBIAR PASSWORD */}

        <Link

          href="/cambiar-password"

          className="
            bg-[#0F3D1F]
            text-white
            px-4
            py-2
            rounded-lg
            hover:bg-[#14532d]
            transition
          "
        >

          Cambiar contraseña

        </Link>

        {/* LOGOUT */}

        <button

          onClick={() =>
            signOut()
          }

          className="
            bg-red-600
            text-white
            px-4
            py-2
            rounded-lg
            hover:bg-red-700
            transition
          "
        >

          Cerrar sesión

        </button>

      </div>

    </header>
  );
}