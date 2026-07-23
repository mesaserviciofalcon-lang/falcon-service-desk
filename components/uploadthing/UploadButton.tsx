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

  allowedExtensions,

  requiredFileName,

}: any) {

  return (

    <div className="mt-4">

      <UploadButtonBase

        endpoint="archivoUploader"

        onBeforeUploadBegin={(files) => {

          if (requiredFileName) {
            const archivoNombreIncorrecto =
              files.find(
                (file) =>
                  file.name !==
                  requiredFileName
              );

            if (archivoNombreIncorrecto) {
              alert(
                `No fue posible subir este archivo. El archivo debe llamarse "${requiredFileName}" y actualmente se llama "${archivoNombreIncorrecto.name}".`
              );

              return [];
            }
          }

          if (
            allowedExtensions?.length
          ) {
            const archivoNoPermitido =
              files.find((file) => {
                const extension =
                  file.name
                    .split(".")
                    .pop()
                    ?.toLowerCase();

                return (
                  !extension ||
                  !allowedExtensions.includes(
                    extension
                  )
                );
              });

            if (archivoNoPermitido) {
              alert(
                `El archivo "${archivoNoPermitido.name}" no tiene un formato permitido. Use únicamente Excel (.xlsx o .xls).`
              );

              return [];
            }
          }

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
            "ut-ready:bg-black ut-uploading:bg-gray-800 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 border border-black shadow-sm transition min-w-52 justify-center",

          container:
            "flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-xl p-6 bg-white",

          allowedContent:
            "text-gray-500 text-sm",

        }}

        content={{

          button({
            ready,
            isUploading,
            uploadProgress,
          }) {

            if (!ready) {

              return "Preparando...";
            }

            if (isUploading) {

              return `Subiendo ${uploadProgress}%`;
            }

            return "Seleccionar archivos";
          },

          allowedContent() {

            if (
              allowedExtensions?.length
            ) {
              return `Solo Excel (.xlsx o .xls) hasta ${MAX_FILE_SIZE_MB} MB`;
            }

            return `Imágenes, PDF y archivos hasta ${MAX_FILE_SIZE_MB} MB`;
          },

          clearBtn() {

            return "Quitar";
          },
        }}
      />

    </div>
  );
}
