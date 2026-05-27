"use client";

import {
  generateUploadButton,
} from "@uploadthing/react";

const UploadButtonBase =
  generateUploadButton();

export default function UploadButton({

  onComplete,

}: any) {

  return (

    <div className="mt-4">

      <UploadButtonBase

        endpoint="archivoUploader"

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

          alert(
            `ERROR: ${error.message}`
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