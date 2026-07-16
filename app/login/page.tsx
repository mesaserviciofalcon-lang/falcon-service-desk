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

      <div className="hidden lg:flex relative w-1/2 min-h-screen overflow-hidden bg-[#052b17] text-white">

        <Image

          src="/login-equipo-seguridad.webp"

          alt="Equipo de seguridad Falcon Farms"

          fill

          priority

          quality={95}

          sizes="50vw"

          className="object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-[#052b17]/45 via-[#052b17]/10 to-[#052b17]/80" />

        <div className="relative z-10 flex min-h-screen w-full flex-col p-10 xl:p-12">

          <div className="flex justify-center">

            <div className="bg-white p-3 rounded-full shadow-2xl">

              <Image

                src="/logo-falcon.png"

                alt="Falcon"

                width={118}

                height={118}

                className="rounded-full"
              />

            </div>
          </div>

          <div className="mx-auto mt-auto max-w-xl text-center">

          <h1 className="text-5xl font-bold leading-tight mb-5 drop-shadow-xl">

            Falcon
            <span className="text-[#2FAE4A]">
              {" "}
              Service Desk
            </span>

          </h1>

          <p className="text-xl text-green-50 leading-relaxed drop-shadow-lg">

            Plataforma corporativa para la gestión
            de tickets y procesos operativos de
            seguridad.

          </p>

          </div>

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
