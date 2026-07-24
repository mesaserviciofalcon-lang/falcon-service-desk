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

  requiredSheetName,

  requiredHeaders,

}: any) {

  return (

    <div className="mt-4">

      <UploadButtonBase

        endpoint="archivoUploader"

        onBeforeUploadBegin={async (files) => {

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
            requiredSheetName &&
            requiredHeaders?.length
          ) {
            try {
              const XLSX =
                await import("xlsx");

              const archivoExcel =
                files[0];

              const buffer =
                await archivoExcel
                  .arrayBuffer();

              const workbook =
                XLSX.read(buffer, {
                  type: "array",
                  cellDates: true,
                });

              const sheetName =
                workbook.SheetNames[0];

              if (
                sheetName !==
                requiredSheetName
              ) {
                alert(
                  `No fue posible subir este archivo. El nombre de la hoja debe ser "${requiredSheetName}". Actualmente es "${sheetName || "sin hoja"}".`
                );

                return [];
              }

              const sheet =
                workbook.Sheets[
                  sheetName
                ];

              const range =
                sheet?.["!ref"]
                  ? XLSX.utils
                      .decode_range(
                        sheet["!ref"]
                      )
                  : null;

              if (!range) {
                alert(
                  "No fue posible subir este archivo. La hoja DATOS no tiene encabezados."
                );

                return [];
              }

              const headers: string[] =
                [];

              for (
                let columna = range.s.c;
                columna <= range.e.c;
                columna++
              ) {
                const celda =
                  sheet[
                    XLSX.utils
                      .encode_cell({
                        r: range.s.r,
                        c: columna,
                      })
                  ];

                headers.push(
                  celda?.v
                    ? String(celda.v)
                        .trim()
                        .toUpperCase()
                    : ""
                );
              }

              const normalizar = (
                valor: string
              ) =>
                valor
                  .trim()
                  .toUpperCase();

              for (
                let index = 0;
                index <
                requiredHeaders.length;
                index++
              ) {
                const esperado =
                  requiredHeaders[index];

                const actual =
                  headers[index] || "";

                if (
                  normalizar(actual) !==
                  normalizar(esperado)
                ) {
                  alert(
                    `No fue posible subir este archivo. La columna ${XLSX.utils.encode_col(index)} debe ser "${esperado}" y actualmente está como "${actual || "vacía"}".`
                  );

                  return [];
                }
              }

              const extras =
                headers
                  .slice(
                    requiredHeaders.length
                  )
                  .filter(Boolean);

              if (extras.length > 0) {
                alert(
                  `No fue posible subir este archivo. La columna ${XLSX.utils.encode_col(requiredHeaders.length)} no debe existir. Elimine columnas adicionales.`
                );

                return [];
              }

              const indiceIdentificacion =
                requiredHeaders.findIndex(
                  (header: string) =>
                    header
                      .normalize("NFD")
                      .replace(
                        /[\u0300-\u036f]/g,
                        ""
                      )
                      .trim()
                      .toUpperCase() ===
                    "IDENTIFICACION"
                );

              if (
                indiceIdentificacion >= 0
              ) {
                const vistos =
                  new Map<string, number>();

                for (
                  let fila = range.s.r + 1;
                  fila <= range.e.r;
                  fila++
                ) {
                  const celda =
                    sheet[
                      XLSX.utils
                        .encode_cell({
                          r: fila,
                          c: indiceIdentificacion,
                        })
                    ];

                  const documento =
                    celda?.v
                      ? String(celda.v)
                          .replace(/\D/g, "")
                          .trim()
                      : "";

                  if (!documento) {
                    continue;
                  }

                  const numeroFila =
                    fila + 1;

                  const filaOriginal =
                    vistos.get(documento);

                  if (filaOriginal) {
                    alert(
                      `No fue posible subir este archivo. La fila ${numeroFila} tiene el número de documento ${documento} duplicado. También aparece en la fila ${filaOriginal}. Debe eliminar el registro repetido.`
                    );

                    return [];
                  }

                  vistos.set(
                    documento,
                    numeroFila
                  );
                }
              }

            } catch (error) {
              console.error(error);

              alert(
                "No fue posible validar el Excel. Revise que sea un archivo .xlsx o .xls válido."
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
            "ut-ready:bg-black ut-uploading:bg-gray-800 bg-black text-white px-3 py-2 text-sm rounded-lg hover:bg-gray-800 border border-black shadow-sm transition min-w-36 justify-center",

          container:
            "flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-3 bg-white",

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

              return `${uploadProgress}%`;
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
