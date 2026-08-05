"use client";

import toast
from "react-hot-toast";

export default function ReabrirTicket({

  ticketId,

  usuario,

  motivo =
    "Ticket reabierto por solicitante",

}: {

  ticketId: number;

  usuario: string;

  motivo?: string;
}) {

  async function reabrirTicket() {

    const confirmar =
      window.confirm(
        "¿Está seguro de reabrir este ticket?"
      );

    if (!confirmar) {
      return;
    }

    try {

      const response =
        await fetch(

          `/api/solicitudes/${ticketId}`,

          {

            method: "PATCH",

            headers: {

              "Content-Type":
                "application/json",
            },

body: JSON.stringify({

  estado: "REABIERTO",

  observacionesTecnico:
  motivo,

  gestionadoPor:
    usuario,
}),
          }
        );

      if (!response.ok) {

        const errorData =
          await response.json();

        console.log(
          errorData
        );

        throw new Error(
          "Error al reabrir"
        );
      }

      toast.success(
  "Ticket reabierto correctamente"
);

setTimeout(() => {

  window.location.reload();

}, 1200);

    } catch (error) {

      console.error(error);

      toast.error(
  "Error al reabrir ticket"
);
    }
  }

  return (

    <button

      onClick={
        reabrirTicket
      }

      className="mt-4 rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
    >

      Reabrir Ticket

    </button>
  );
}
