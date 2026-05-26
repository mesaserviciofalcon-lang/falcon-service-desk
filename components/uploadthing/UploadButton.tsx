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
    />
  );
}