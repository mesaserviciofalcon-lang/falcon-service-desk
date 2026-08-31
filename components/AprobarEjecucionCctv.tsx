"use client";

import { useState } from "react";

import toast from "react-hot-toast";

import { useRouter } from "next/navigation";

export default function AprobarEjecucionCctv({
  ticketId,
}: {
  ticketId: number;
}) {
  const router = useRouter();
  const [aprobando, setAprobando] =
    useState(false);

  async function aprobar() {
    if (aprobando) return;

    setAprobando(true);

    try {
      const response = await fetch(
        `/api/solicitudes/${ticketId}/aprobar-ejecucion`,
        { method: "POST" }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo aprobar el ticket"
        );
      }

      toast.success(
        data.correoEnviado
          ? "Ticket aprobado y técnico notificado"
          : "Ticket aprobado, pero no se pudo enviar el correo al técnico. Revise los registros de Vercel."
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo aprobar el ticket"
      );
    } finally {
      setAprobando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={aprobar}
      disabled={aprobando}
      className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-emerald-400"
    >
      {aprobando
        ? "Aprobando..."
        : "Aprobar para ejecucion"}
    </button>
  );
}
