"use client";

import {

  useState,

} from "react";

export default function CambiarPasswordPage() {

  const [

    actual,

    setActual

  ] = useState("");

  const [

    nueva,

    setNueva

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
      nueva !== confirmar
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

          "/api/cambiar-password",

          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              actual,

              nueva,
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

      setActual("");

      setNueva("");

      setConfirmar("");

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

        Cambiar contraseña

      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >

        <input

          type="password"

          placeholder="Contraseña actual"

          value={actual}

          onChange={(e) =>
            setActual(
              e.target.value
            )
          }

          className="border p-4 rounded-xl"
        />

        <input

          type="password"

          placeholder="Nueva contraseña"

          value={nueva}

          onChange={(e) =>
            setNueva(
              e.target.value
            )
          }

          className="border p-4 rounded-xl"
        />

        <input

          type="password"

          placeholder="Confirmar nueva contraseña"

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
            hover:bg-[#14532d]
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