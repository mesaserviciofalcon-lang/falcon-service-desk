"use client";

import toast
from "react-hot-toast";

export default function ReabrirTicket({

  ticketId,

  usuario,

}: {

  ticketId: number;

  usuario: string;
}) {

  async function reabrirTicket() {

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
  "Ticket reabierto por solicitante",

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

      className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
    >

      Reabrir Ticket

    </button>
  );
}
