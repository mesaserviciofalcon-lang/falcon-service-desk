"use client";

import { useRouter }
from "next/navigation";

import { useState }
from "react";

import toast
from "react-hot-toast";

export default function EliminarTicketButton({
  ticketId,
}: {
  ticketId: number;
}) {
  const router =
    useRouter();

  const [eliminando, setEliminando] =
    useState(false);

  async function eliminarTicket() {
    const confirmar =
      window.confirm(
        `¿Seguro que desea eliminar el ticket #${ticketId}? Esta accion no se puede deshacer.`
      );

    if (!confirmar || eliminando) {
      return;
    }

    try {
      setEliminando(true);

      const response =
        await fetch(
          `/api/solicitudes/${ticketId}`,
          {
            method: "DELETE",
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
        "Ticket eliminado correctamente"
      );

      router.push("/tickets");
      router.refresh();

    } catch (error: any) {
      console.error(error);

      toast.error(
        error.message ||
        "Error al eliminar ticket"
      );

    } finally {
      setEliminando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={eliminarTicket}
      disabled={eliminando}
      className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:bg-gray-400"
    >
      {eliminando
        ? "Eliminando..."
        : "Eliminar ticket"}
    </button>
  );
}
