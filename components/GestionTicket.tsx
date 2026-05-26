"use client";

import { useRouter } from "next/navigation";

import { useState }
from "react";

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

  const [archivo, setArchivo] =
  useState<any>(null);

  const [
    loading,
    setLoading,
  ] = useState(false);
  const router = useRouter();

  async function guardarGestion() {

    try {

      setLoading(true);

      // SUBIR ARCHIVO

      if (archivo) {

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

      alert(
        "Gestión guardada"
      );

      router.refresh();

    } catch (error) {

      console.error(error);

      alert(
        "Error al actualizar"
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

      <UploadButton

  onComplete={(

  url: any,

  nombre: any,

  tipo: any

) => {

    setArchivo({

      url,
      nombre,
      tipo,
    } as any);
  }}
/>

      <button

        onClick={
          guardarGestion
        }

        disabled={loading}

        className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
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