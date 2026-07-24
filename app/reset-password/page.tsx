"use client";

import {

  useSearchParams,

} from "next/navigation";

import {

  Suspense,

  useState,

} from "react";

function ResetPasswordContent() {

  const searchParams =
    useSearchParams();

  const token =
    searchParams.get(
      "token"
    );

  const [

    password,

    setPassword

  ] = useState("");

  const [

    confirmar,

    setConfirmar

  ] = useState("");

  const [

    loading,

    setLoading

  ] = useState(false);

  async function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault();

    if (
      password !== confirmar
    ) {

      alert(
        "Las contraseñas no coinciden"
      );

      return;
    }

    try {

      setLoading(true);

      const response =
        await fetch(

          "/api/reset-password",

          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              token,

              password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.error
        );
      }

      alert(
        "Contraseña actualizada"
      );

      window.location.href =
        "/login";

    } catch (error: any) {

      alert(
        error.message
      );

    } finally {

      setLoading(false);
    }
  }

  return (

    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8">

      <h1 className="text-3xl font-bold mb-6 text-[#0F3D1F]">

        Nueva contraseña

      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >

        <input

          type="password"

          placeholder="Nueva contraseña"

          value={password}

          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }

          className="border p-4 rounded-xl"
        />

        <input

          type="password"

          placeholder="Confirmar contraseña"

          value={confirmar}

          onChange={(e) =>
            setConfirmar(
              e.target.value
            )
          }

          className="border p-4 rounded-xl"
        />

        <button

          type="submit"

          disabled={loading}

          className="
            bg-[#0F3D1F]
            text-white
            p-4
            rounded-xl
          "
        >

          {

            loading

              ? "Actualizando..."

              : "Cambiar contraseña"
          }

        </button>

      </form>

    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#E8EEF2]" />
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
