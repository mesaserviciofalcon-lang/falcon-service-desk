import { createUploadthing, createRouteHandler } from "uploadthing/next";

const f = createUploadthing();

const uploadRouter = {

  archivoUploader: f({

    image: {
      maxFileSize: "8MB",
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