"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import UploadButton from "@/components/uploadthing/UploadButton";

export default function EditarFotoEquipoAdministrativo({
  integranteId,
}: {
  integranteId: number;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardarFoto() {
    if (!fotoUrl) {
      toast.error("Seleccione la nueva foto antes de guardar");
      return;
    }

    try {
      setGuardando(true);
      const response = await fetch(
        "/api/equipo-administrativo",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: integranteId,
            fotoUrl,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudo actualizar la foto"
        );
      }

      toast.success("Foto actualizada correctamente");
      setFotoUrl("");
      setAbierto(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la foto"
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setAbierto((actual) => !actual)}
        className="rounded-lg border px-3 py-2 text-sm font-semibold text-[#0F3D1F] hover:bg-slate-50"
      >
        {abierto ? "Cancelar" : "Cambiar foto"}
      </button>

      {abierto && (
        <div className="mt-3 rounded-lg border border-dashed bg-slate-50 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-700">
            Seleccione la nueva fotografía
          </p>
          <UploadButton
            allowedExtensions={["jpg", "jpeg", "png", "webp"]}
            allowedExtensionsLabel="JPG, JPEG, PNG o WEBP"
            onComplete={(url: string) => {
              setFotoUrl(url);
              toast.success("Nueva foto cargada. Guarde el cambio.");
            }}
          />
          {fotoUrl && (
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="text-emerald-700">
                Nueva foto lista para guardar.
              </span>
              <button
                type="button"
                onClick={() => setFotoUrl("")}
                className="font-semibold text-red-700 hover:underline"
              >
                Quitar adjunto
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={guardarFoto}
            disabled={!fotoUrl || guardando}
            className="mt-3 rounded-lg bg-[#0F3D1F] px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
          >
            {guardando ? "Guardando..." : "Guardar nueva foto"}
          </button>
        </div>
      )}
    </div>
  );
}
