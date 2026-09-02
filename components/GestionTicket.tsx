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

  resultadoVisitaActual,

}: {

  ticketId: number;

  usuario: string;

  role: string;

  estadoActual: string;

  tipoSolicitud?: string;

  resultadoVisitaActual?: string | null;

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
    resultadoVisita,
    setResultadoVisita,
  ] = useState(
    resultadoVisitaActual || ""
  );

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

  const esVisita =
    tipoSolicitud ===
    "VISITA DOMICILIARIA";

  const esCargaSoporteSolicitante =
    role === "SOLICITANTE";

  const extensionesPermitidas =
    esCargaSoporteSolicitante
      ? [
          "jpg",
          "jpeg",
          "png",
          "webp",
          "pdf",
        ]
      : esAntecedentes
      ? [
          "xlsx",
          "xls",
        ]
      : undefined;

  const esSoporteReapertura =
    role === "SOLICITANTE" &&
    estadoActual === "REABIERTO";

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

    if (
      role !== "SOLICITANTE" &&
      !observaciones.trim()
    ) {
      toast.error(
        "Debe registrar una observación de la gestión"
      );
      return;
    }

    if (
      role !== "SOLICITANTE" &&
      esVisita &&
      estado === "COMPLETADO" &&
      !resultadoVisita
    ) {
      toast.error(
        "Debe seleccionar el resultado de la visita"
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

      if (
        esSoporteReapertura &&
        !observaciones.trim()
      ) {
        toast.success(
          "Soporte adjuntado correctamente"
        );

        setTimeout(() => {

          router.push(
            "/dashboard"
          );

        }, 1200);

        return;
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

              ...(esSoporteReapertura
                ? {}
                : {
                    estado:
                      role === "SOLICITANTE"
                        ? "REABIERTO"
                        : estado,
                  }),

              observacionesTecnico:
                observaciones,

              gestionadoPor:
                usuario,

              ...(role !== "SOLICITANTE" &&
              esVisita
                ? {
                    resultadoVisita,
                  }
                : {}),
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

      {role !==
        "SOLICITANTE" &&
        esVisita && (

        <select

          value={resultadoVisita}

          onChange={(e) =>
            setResultadoVisita(
              e.target.value
            )
          }

          className="border p-3 rounded-lg"
        >

          <option value="">

            Resultado de la visita

          </option>

          <option value="CONFIABLE">

            CONFIABLE

          </option>

          <option value="NO CONFIABLE">

            NO CONFIABLE

          </option>

          <option value="NO SE REALIZO">

            NO SE REALIZO

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

      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">

        <p className="mb-2 text-sm font-semibold text-gray-700">
          {esCargaSoporteSolicitante
            ? "Adjuntar soporte de reapertura"
            : "Adjuntar archivo"}
        </p>

      <UploadButton

        allowedExtensions={
          extensionesPermitidas
        }

        allowedExtensionsLabel={
          esCargaSoporteSolicitante
            ? "imagenes (.jpg, .jpeg, .png, .webp) o PDF (.pdf)"
            : esAntecedentes
            ? "Excel (.xlsx o .xls)"
            : undefined
        }

        requiredFileName={
          esAntecedentes &&
          !esCargaSoporteSolicitante
            ? nombrePlantillaAntecedentes
            : undefined
        }

        requiredSheetName={
          esAntecedentes &&
          !esCargaSoporteSolicitante
            ? nombreHojaAntecedentes
            : undefined
        }

        requiredHeaders={
          esAntecedentes &&
          !esCargaSoporteSolicitante
            ? encabezadosAntecedentesSolicitud
            : undefined
        }

        validateRequiredRows={
          esAntecedentes &&
          !esCargaSoporteSolicitante
        }

        validateFechaSolicitudHoy={
          esAntecedentes &&
          !esCargaSoporteSolicitante
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

      </div>

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

                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{archivo.nombre}</p>
                    <button type="button" onClick={() => setArchivos((actual) => actual.filter((_, indice) => indice !== index))} className="font-semibold text-red-700 hover:underline">Quitar adjunto</button>
                  </div>

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
