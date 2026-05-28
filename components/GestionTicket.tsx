"use client";

import { useRouter }
from "next/navigation";

import { useState }
from "react";

import toast
from "react-hot-toast";

import UploadButton
from "@/components/uploadthing/UploadButton";

export default function GestionTicket({

  ticketId,

  usuario,

  role,

  estadoActual,

}: {

  ticketId: number;

  usuario: string;

  role: string;

  estadoActual: string;

}) {

  const [
    estado,
    setEstado,
  ] = useState("EN PROCESO");

  const [
    observaciones,
    setObservaciones,
  ] = useState("");

  const [

    archivos,

    setArchivos

  ] = useState<any[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const router =
    useRouter();

  async function guardarGestion() {

    try {

      setLoading(true);

      // GUARDAR ARCHIVOS

      if (archivos.length > 0) {

        for (const archivo of archivos) {

          await fetch(
            "/api/guardar-archivo",
            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({

                solicitudId:
                  ticketId,

                nombre:
                  archivo.nombre,

                ruta:
                  archivo.url,

                tipo:
                  archivo.tipo,
              }),
            }
          );
        }
      }

      // ACTUALIZAR TICKET

      const response =
        await fetch(

          `/api/solicitudes/${ticketId}`,

          {

            method: "PATCH",

            headers: {

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              estado:
                role === "SOLICITANTE"
                  ? "REABIERTO"
                  : estado,

              observacionesTecnico:
                observaciones,

              gestionadoPor:
                usuario,
            }),
          }
        );

      if (!response.ok) {

        const errorData =
          await response.json();

        console.log(
          errorData
        );

        throw new Error(
          errorData.error ||
          "Error"
        );
      }

      toast.success(
  "Gestión guardada correctamente"
);

setTimeout(() => {

  router.refresh();

}, 1200);

    } catch (error) {

      console.error(error);

      toast.error(
  "Error al actualizar ticket"
);

    } finally {

      setLoading(false);
    }
  }

  return (

    <div className="mt-4 border-t pt-4 flex flex-col gap-4">

      <h3 className="font-bold text-lg">

        Gestionar Ticket

      </h3>

      {/* SOLO TECNICOS */}

      {role !==
        "SOLICITANTE" && (

        <select

          value={estado}

          onChange={(e) =>
            setEstado(
              e.target.value
            )
          }

          className="border p-3 rounded-lg"
        >

          <option value="EN PROCESO">

            EN PROCESO

          </option>

          <option value="COMPLETADO">

            COMPLETADO

          </option>

          <option value="REABIERTO">

            REABIERTO

          </option>

        </select>
      )}

      <textarea

        placeholder={

          role ===
          "SOLICITANTE"

            ? "Explique por qué reabre el ticket"

            : "Observaciones técnicas"
        }

        value={observaciones}

        onChange={(e) =>
          setObservaciones(
            e.target.value
          )
        }

        className="border p-3 rounded-lg"
      />

      {/* ARCHIVOS */}

      <UploadButton

        onComplete={(

          url: string,

          nombre: string,

          tipo: string

        ) => {

          setArchivos((prev) => [

            ...prev,

            {
              url,
              nombre,
              tipo,
            },
          ]);
        }}
      />

      {/* LISTA ARCHIVOS */}

      {archivos.length > 0 && (

        <div className="mt-4">

          <h3 className="font-bold mb-2">

            Archivos cargados

          </h3>

          <div className="flex flex-col gap-2">

            {archivos.map(
              (
                archivo: any,
                index: number
              ) => (

                <div

                  key={index}

                  className="
                    border
                    rounded-lg
                    p-3
                    bg-gray-50
                  "
                >

                  <p className="font-medium">

                    {archivo.nombre}

                  </p>

                </div>
              )
            )}

          </div>

        </div>
      )}

      <button

        onClick={
          guardarGestion
        }

        disabled={loading}

        className="
          bg-blue-600
          text-white
          p-3
          rounded-lg
          hover:bg-blue-700
        "
      >

        {

          loading

            ? "Guardando..."

            : "Guardar gestión"
        }

      </button>

    </div>
  );
}