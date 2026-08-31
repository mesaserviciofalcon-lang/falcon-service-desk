"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import UploadButton from "@/components/uploadthing/UploadButton";

export default function GestionEquipoAdministrativo() {
  const router = useRouter();
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [cargo, setCargo] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function registrarIntegrante(event: React.FormEvent) {
    event.preventDefault();

    if (!fotoUrl) {
      toast.error("Debe cargar una foto antes de registrar a la persona");
      return;
    }

    try {
      setGuardando(true);
      const response = await fetch("/api/equipo-administrativo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombres,
          apellidos,
          cargo,
          fotoUrl,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo registrar a la persona");
      }

      toast.success("Integrante agregado al equipo administrativo");
      setNombres("");
      setApellidos("");
      setCargo("");
      setFotoUrl("");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo registrar a la persona"
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form
      onSubmit={registrarIntegrante}
      className="mb-8 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-bold text-[#0F3D1F]">
        Agregar integrante
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Registre los datos y cargue una fotografía tipo retrato.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          Nombres
          <input
            value={nombres}
            onChange={(event) => setNombres(event.target.value)}
            className="rounded-lg border border-slate-300 p-3 font-normal"
            placeholder="Ej. María Elena"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          Apellidos
          <input
            value={apellidos}
            onChange={(event) => setApellidos(event.target.value)}
            className="rounded-lg border border-slate-300 p-3 font-normal"
            placeholder="Ej. Gómez Pérez"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          Cargo
          <input
            value={cargo}
            onChange={(event) => setCargo(event.target.value)}
            className="rounded-lg border border-slate-300 p-3 font-normal"
            placeholder="Ej. Coordinadora Administrativa"
            required
          />
        </label>
        <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          Fotografía
          <UploadButton
            allowedExtensions={["jpg", "jpeg", "png", "webp"]}
            allowedExtensionsLabel="JPG, JPEG, PNG o WEBP"
            onComplete={(url: string) => {
              setFotoUrl(url);
              toast.success("Foto cargada. Ya puede registrar a la persona.");
            }}
          />
        </div>
      </div>

      {fotoUrl && (
        <p className="mt-4 text-sm font-medium text-emerald-700">
          Foto cargada correctamente.
        </p>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="mt-6 rounded-lg bg-[#0F3D1F] px-5 py-3 font-semibold text-white hover:bg-[#14532d] disabled:opacity-60"
      >
        {guardando ? "Guardando..." : "Agregar al equipo"}
      </button>
    </form>
  );
}
