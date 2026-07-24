"use client";

import { useState }
from "react";

import toast
from "react-hot-toast";

import UploadButton
from "@/components/uploadthing/UploadButton";

import {
  encabezadosAntecedentesHistorico,
  nombreHojaAntecedentes,
  nombrePlantillaAntecedentes,
}
from "@/lib/antecedentesPlantilla";

export default function ImportarHistoricoAntecedentes() {
  const [importando, setImportando] =
    useState(false);

  async function importarArchivo(
    url: string,
    nombre: string,
    tipo: string
  ) {
    try {
      setImportando(true);

      const response =
        await fetch(
          "/api/antecedentes/importar",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              url,
              nombre,
              tipo,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "No se pudo importar"
        );
      }

      toast.success(
        `Historico importado: ${data.registros} registros`
      );

    } catch (error: any) {
      console.error(error);

      toast.error(
        error.message ||
        "Error importando historico"
      );

    } finally {
      setImportando(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl bg-white p-5 shadow-md">
      <div className="mb-3">
        <h2 className="text-xl font-bold">
          Cargar base historica
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Suba un Excel con las columnas completas del historico de antecedentes.
        </p>
      </div>

      <UploadButton
        allowedExtensions={[
          "xlsx",
          "xls",
        ]}
        requiredFileName={
          nombrePlantillaAntecedentes
        }
        requiredSheetName={
          nombreHojaAntecedentes
        }
        requiredHeaders={
          encabezadosAntecedentesHistorico
        }
        onComplete={importarArchivo}
      />

      {importando && (
        <p className="mt-3 text-sm text-blue-600">
          Importando registros, espere por favor...
        </p>
      )}
    </div>
  );
}
