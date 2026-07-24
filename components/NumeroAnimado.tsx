"use client";

import {
  useEffect,
  useState,
} from "react";

export default function NumeroAnimado({
  valor,
}: {
  valor: number;
}) {
  const [actual, setActual] =
    useState(0);

  useEffect(() => {
    const inicio =
      performance.now();

    const duracion =
      900;

    function animar(
      tiempo: number
    ) {
      const progreso =
        Math.min(
          (tiempo - inicio) /
            duracion,
          1
        );

      const suavizado =
        1 -
        Math.pow(
          1 - progreso,
          3
        );

      setActual(
        Math.round(
          valor *
            suavizado
        )
      );

      if (progreso < 1) {
        requestAnimationFrame(
          animar
        );
      }
    }

    const frame =
      requestAnimationFrame(
        animar
      );

    return () =>
      cancelAnimationFrame(frame);
  }, [valor]);

  return (
    <>
      {actual.toLocaleString(
        "es-CO"
      )}
    </>
  );
}
