import { gzipSync } from "node:zlib";
import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  bytes: number;
  format: string;
};

function assertCronAuth(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!process.env.CRON_SECRET) {
    return new Response("CRON_SECRET no configurado", { status: 500 });
  }

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  return null;
}

function assertCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary no esta configurado para guardar backups.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

function uploadRawBuffer(buffer: Buffer, publicId: string) {
  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "falcon-service-desk/backups",
        public_id: publicId,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary no retorno resultado."));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          bytes: result.bytes,
          format: result.format,
        });
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

export async function GET(request: Request) {
  const authError = assertCronAuth(request);

  if (authError) {
    return authError;
  }

  try {
    assertCloudinaryConfig();

    const [
      solicitudes,
      gestiones,
      archivos,
      cctv,
      visitas,
      radios,
      antecedentes,
      antecedentesRegistros,
      visitasHistoricas,
      novedades,
      usuarios,
    ] = await Promise.all([
      prisma.solicitud.findMany(),
      prisma.gestionTicket.findMany(),
      prisma.archivoAdjunto.findMany(),
      prisma.solicitudCCTV.findMany(),
      prisma.solicitudVisita.findMany(),
      prisma.solicitudRadio.findMany(),
      prisma.solicitudAntecedente.findMany(),
      prisma.antecedenteRegistro.findMany(),
      prisma.visitaHistorica.findMany(),
      prisma.seguridadNovedad.findMany(),
      prisma.usuario.findMany({
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          fincaEAI: true,
          activo: true,
          createdAt: true,
        },
      }),
    ]);

    const generatedAt = new Date();
    const backup = {
      metadata: {
        app: "falcon-service-desk",
        generatedAt: generatedAt.toISOString(),
        format: "json.gz",
        version: 1,
        counts: {
          solicitudes: solicitudes.length,
          gestiones: gestiones.length,
          archivos: archivos.length,
          cctv: cctv.length,
          visitas: visitas.length,
          radios: radios.length,
          antecedentes: antecedentes.length,
          antecedentesRegistros: antecedentesRegistros.length,
          visitasHistoricas: visitasHistoricas.length,
          novedades: novedades.length,
          usuarios: usuarios.length,
        },
      },
      data: {
        solicitudes,
        gestiones,
        archivos,
        cctv,
        visitas,
        radios,
        antecedentes,
        antecedentesRegistros,
        visitasHistoricas,
        novedades,
        usuarios,
      },
    };

    const payload = Buffer.from(JSON.stringify(backup));
    const compressedPayload = gzipSync(payload);
    const publicId = `backup-${generatedAt.toISOString().slice(0, 10)}`;
    const upload = await uploadRawBuffer(compressedPayload, publicId);

    return Response.json({
      ok: true,
      generatedAt: generatedAt.toISOString(),
      url: upload.secure_url,
      publicId: upload.public_id,
      bytes: upload.bytes,
      counts: backup.metadata.counts,
    });
  } catch (error) {
    console.error("Error generando backup semanal:", error);

    return Response.json(
      {
        error: "No fue posible generar el backup semanal.",
      },
      {
        status: 500,
      }
    );
  }
}
