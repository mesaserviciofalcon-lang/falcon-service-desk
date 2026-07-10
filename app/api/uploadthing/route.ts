import { createUploadthing, createRouteHandler } from "uploadthing/next";

const f = createUploadthing();

const uploadRouter = {

  archivoUploader: f({

    image: {
      maxFileSize: "16MB",
      maxFileCount: 5,
    },

    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 5,
    },

    blob: {
      maxFileSize: "16MB",
      maxFileCount: 5,
    },

  }, {
    awaitServerData: false,
  })

  .onUploadError(async ({ error, fileKey }) => {

    console.error(
      "Error subiendo archivo a UploadThing:",
      {
        fileKey,
        message:
          error.message,
      }
    );
  })

  .onUploadComplete(async ({ file }) => {

    console.log("Archivo subido:", file.url);
  }),
};

export const {
  GET,
  POST,
} = createRouteHandler({

  router: uploadRouter,
});
