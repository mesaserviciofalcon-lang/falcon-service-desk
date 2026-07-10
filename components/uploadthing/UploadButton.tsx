"use client";

import {
  generateUploadButton,
} from "@uploadthing/react";

const UploadButtonBase =
  generateUploadButton();

const MAX_FILE_SIZE_MB = 16;

function formatoMb(bytes: number) {

  return (
    bytes / 1024 / 1024
  ).toFixed(1);
}

export default function UploadButton({

  onComplete,

}: any) {

  return (

    <div className="mt-4">

      <UploadButtonBase

        endpoint="archivoUploader"

        onBeforeUploadBegin={(files) => {

          const archivoGrande =
            files.find(
              (file) =>
                file.size >
                MAX_FILE_SIZE_MB *
                  1024 *
                  1024
            );

          if (archivoGrande) {

            alert(
              `El archivo "${archivoGrande.name}" pesa ${formatoMb(
                archivoGrande.size
              )} MB. El máximo permitido es ${MAX_FILE_SIZE_MB} MB.`
            );

            return [];
          }

          return files;
        }}

        onClientUploadComplete={(res: any) => {

          if (!res) return;

          const archivo = res[0];

          onComplete(

            archivo.url,

            archivo.name,

            archivo.type
          );
        }}

        onUploadError={(error: any) => {

          console.error(
            "UploadThing error:",
            error
          );

          alert(
            [
              "No se pudo subir el archivo.",
              "",
              "Si en otra red funciona, probablemente la red de la finca está bloqueando el servicio de carga.",
              "Pruebe con datos móviles u otra red.",
              "Si así funciona, pidan desbloquear uploadthing.com y utfs.io en la red de la finca.",
              "",
              `Detalle técnico: ${error.message}`,
            ].join("\n")
          );
        }}

        appearance={{

          button:
            "bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800",

          container:
            "flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-6",

          allowedContent:
            "text-gray-500 text-sm",

        }}
      />

    </div>
  );
}
