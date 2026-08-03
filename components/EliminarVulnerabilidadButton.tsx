"use client";

import { useRouter }
from "next/navigation";

import { useState }
from "react";

import toast
from "react-hot-toast";

export default function EliminarVulnerabilidadButton({
  id,
  redirectTo,
}: {
  id: number;
  redirectTo?: string;
}) {
  const router =
    useRouter();
  const [eliminando, setEliminando] =
    useState(false);

  async function eliminar() {
    const confirmado =
      window.confirm(
        "Esta seguro de eliminar este analisis? Esta accion no se puede deshacer."
      );

    if (!confirmado) {
      return;
    }

    try {
      setEliminando(true);

      const response =
        await fetch(
          `/api/vulnerabilidades/${id}`,
          {
            method:
              "DELETE",
          }
        );
      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "No se pudo eliminar"
        );
      }

      toast.success(
        "Analisis eliminado"
      );

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.message ||
        "Error eliminando analisis"
      );
    } finally {
      setEliminando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={eliminar}
      disabled={eliminando}
      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:bg-gray-400"
    >
      {eliminando
        ? "Eliminando..."
        : "Eliminar"}
    </button>
  );
}
