"use client";

import {

  useState,

} from "react";

export default function ForgotPasswordPage() {

  const [

    email,

    setEmail

  ] = useState("");

  const [

    loading,

    setLoading

  ] = useState(false);

  async function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault();

    try {

      setLoading(true);

      const response =
        await fetch(

          "/api/forgot-password",

          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              email,
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
        "Se envió el correo de recuperación"
      );

      setEmail("");

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

        Recuperar contraseña

      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
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

              ? "Enviando..."

              : "Recuperar contraseña"
          }

        </button>

      </form>

    </div>
  );
}