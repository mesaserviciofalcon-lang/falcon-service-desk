"use client";

import { useRouter }
from "next/navigation";

import { useState }
from "react";

import toast
from "react-hot-toast";

import UploadButton
from "@/components/uploadthing/UploadButton";

import {
  encabezadosAntecedentesSolicitud,
  nombreHojaAntecedentes,
  nombrePlantillaAntecedentes,
}
from "@/lib/antecedentesPlantilla";

export default function GestionTicket({

  ticketId,

  usuario,

  role,

  estadoActual,

  tipoSolicitud,

}: {

  ticketId: number;

  usuario: string;

  role: string;

  estadoActual: string;

  tipoSolicitud?: string;

}) {

  const [
    estado,
    setEstado,
  ] = useState("");

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

  const esAntecedentes =
    tipoSolicitud ===
    "ANTECEDENTES";

  async function guardarGestion() {

  if (loading) return;

  try {

    if (
      role !== "SOLICITANTE" &&
      !estado
    ) {
      toast.error(
        "Debe seleccionar el estado del ticket"
      );
      return;
    }

    setLoading(true);


      // GUARDAR ARCHIVOS

      if (archivos.length > 0) {

        for (const archivo of archivos) {

          const archivoResponse =
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

          if (!archivoResponse.ok) {
            const errorData =
              await archivoResponse.json();

            throw new Error(
              errorData.error ||
              "No se pudo guardar el archivo"
            );
          }
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

  router.push(
    "/dashboard"
  );

}, 1200);

    } catch (error: any) {

      console.error(error);

      toast.error(
  error.message ||
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

          required
        >

          <option value="">

            Seleccione estado

          </option>

          <option value="EN PROCESO">

            EN PROCESO

          </option>

          <option value="COMPLETADO">

            COMPLETADO

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

        allowedExtensions={
          esAntecedentes
            ? [
                "xlsx",
                "xls",
              ]
            : undefined
        }

        requiredFileName={
          esAntecedentes
            ? nombrePlantillaAntecedentes
            : undefined
        }

        requiredSheetName={
          esAntecedentes
            ? nombreHojaAntecedentes
            : undefined
        }

        requiredHeaders={
          esAntecedentes
            ? encabezadosAntecedentesSolicitud
            : undefined
        }

        validateRequiredRows={
          esAntecedentes
        }

        onComplete={(

          url: string,

          nombre: string,

          tipo: string

        ) => {

          setArchivos(() => [

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

      <div className="flex justify-center">

      <button

        onClick={
          guardarGestion
        }

        disabled={loading}

        className="
          bg-blue-600
          text-white
          px-4
          py-2
          text-sm
          font-semibold
          rounded-md
          hover:bg-blue-700
        "
      >

        {

          loading

            ? "Guardando gestión..."

            : "Guardar gestión"
        }

      </button>

      </div>

    </div>
  );
}
