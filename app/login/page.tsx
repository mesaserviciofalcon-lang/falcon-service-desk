"use client";

import Image from "next/image";

import {
  signIn,
} from "next-auth/react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  useState,
} from "react";

export default function LoginPage() {

  const router =
    useRouter();

    const searchParams =
  useSearchParams();

const redirectTo =

  searchParams.get(
    "redirect"
  ) || "/dashboard";

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  async function handleLogin(
    e: React.FormEvent
  ) {

    e.preventDefault();

    setLoading(true);

    const result =
      await signIn(
        "credentials",
        {

          email,

          password,

          redirect: false,
        }
      );

    if (result?.ok) {

      router.push(
  redirectTo
);

    } else {

      alert(
        "Credenciales incorrectas"
      );
    }

    setLoading(false);
  }

  return (

    <div className="min-h-screen flex bg-[#F4F6F8]">

      {/* PANEL IZQUIERDO */}

      <div className="hidden lg:flex relative w-1/2 min-h-screen overflow-hidden text-white">

        <Image

          src="/login-equipo-seguridad.webp"

          alt="Equipo de seguridad Falcon Farms"

          fill

          priority

          sizes="50vw"

          className="object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#052b17]/95 via-[#052b17]/65 to-[#052b17]/25" />

        <div className="relative z-10 flex h-full w-full flex-col p-12 xl:p-16">

          <div className="bg-white p-3 rounded-full shadow-2xl w-fit">

            <Image

              src="/logo-falcon.png"

              alt="Falcon"

              width={112}

              height={112}

              className="rounded-full"
            />

          </div>

          <h1 className="mt-auto text-5xl font-bold leading-tight mb-6 max-w-xl">

            Falcon
            <span className="text-[#2FAE4A]">
              {" "}
              Service Desk
            </span>

          </h1>

          <p className="text-xl text-green-100 leading-relaxed max-w-xl">

            Plataforma corporativa para la gestión
            de tickets y procesos operativos de
            seguridad.

          </p>

        </div>

      </div>

      {/* LOGIN */}

      <div className="flex w-full lg:w-1/2 justify-center items-center p-8 bg-[#F4F6F8]">

        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">

          <div className="flex flex-col items-center mb-8">

            <div className="lg:hidden mb-4">

              <Image

                src="/logo-falcon.png"

                alt="Falcon"

                width={120}

                height={120}

                className="rounded-full"
              />

            </div>

            <h2 className="text-4xl font-bold text-[#0F3D1F] text-center">

              Bienvenido

            </h2>

            <p className="text-gray-500 mt-3 text-center">

              Inicia sesión para acceder al sistema

            </p>

          </div>

          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-5"
          >

            <input

              type="email"

              placeholder="Correo corporativo"

              value={email}

              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }

              className="w-full border border-gray-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#2FAE4A]"
            />

            <input

              type="password"

              placeholder="Contraseña"

              value={password}

              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }

              className="w-full border border-gray-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#2FAE4A]"
            />

            <button

              type="submit"

              disabled={loading}

              className="bg-[#0F3D1F] hover:bg-[#14532d] transition text-white font-bold p-4 rounded-xl shadow-lg"
            >

              {

                loading

                  ? "Ingresando..."

                  : "Ingresar al sistema"
              }

            </button>

            <div className="flex justify-between mt-2 text-sm">

  <a

    href="/forgot-password"

    className="
      text-[#0F3D1F]
      hover:underline
    "
  >

    ¿Olvidó su contraseña?

  </a>

</div>

          </form>

          <div className="mt-8 border-t pt-6 text-center">

            <p className="text-sm text-gray-500">

              Falcon Farms — Security Department

            </p>

            <p className="text-xs text-gray-400 mt-2">

              Powered by Gerat Technology

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}
