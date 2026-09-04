import Link
from "next/link";

import { redirect }
from "next/navigation";

import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

import MetricasVulnerabilidadFinca
from "@/components/MetricasVulnerabilidadFinca";

import { esAnalistaSig }
from "@/lib/permisosUsuarios";
import { fincasAsignadasAnalistaSig } from "@/lib/fincasAnalistaSig";
import { estaVencidoCierreVulnerabilidad } from "@/lib/vulnerabilidades";

type SearchParams = {
  mes?: string;
  anio?: string;
};

function mesActualBogota() {
  const ahora =
    new Date();

  return ahora.toLocaleDateString(
    "sv-SE",
    {
      year: "numeric",
      month: "2-digit",
      timeZone:
        "America/Bogota",
    }
  );
}

function anioActualBogota() {
  return mesActualBogota()
    .slice(0, 4);
}

function rangoMesBogota(
  mes: string
) {
  const [
    yearText,
    monthText,
  ] = mes.split("-");
  const year =
    Number(yearText);
  const month =
    Number(monthText);

  if (
    !year ||
    !month ||
    month < 1 ||
    month > 12
  ) {
    return rangoMesBogota(
      mesActualBogota()
    );
  }

  return {
    inicio:
      new Date(
        Date.UTC(
          year,
          month - 1,
          1,
          5,
          0,
          0
        )
      ),
    fin:
      new Date(
        Date.UTC(
          month === 12
            ? year + 1
            : year,
          month === 12
            ? 0
            : month,
          1,
          5,
          0,
          0
        )
      ),
  };
}

function rangoAnioBogota(
  anio: string
) {
  const year =
    Number(anio);

  if (!year) {
    return rangoAnioBogota(
      anioActualBogota()
    );
  }

  return {
    inicio:
      new Date(
        Date.UTC(
          year,
          0,
          1,
          5,
          0,
          0
        )
      ),
    fin:
      new Date(
        Date.UTC(
          year + 1,
          0,
          1,
          5,
          0,
          0
        )
      ),
  };
}

function etiquetaMes(
  mes: string
) {
  const {
    inicio,
  } = rangoMesBogota(mes);

  return inicio.toLocaleDateString(
    "es-CO",
    {
      month: "long",
      year: "numeric",
      timeZone:
        "America/Bogota",
    }
  );
}

function calcularPorcentaje(
  valor: number,
  total: number
) {
  if (!total) {
    return "0%";
  }

  return `${Math.round(
    (valor / total) * 100
  )}%`;
}

const coloresFincas = [
  {
    fondo: "bg-emerald-50",
    borde: "border-emerald-500",
    texto: "text-emerald-900",
    punto: "bg-emerald-500",
  },
  {
    fondo: "bg-blue-50",
    borde: "border-blue-500",
    texto: "text-blue-900",
    punto: "bg-blue-500",
  },
  {
    fondo: "bg-amber-50",
    borde: "border-amber-500",
    texto: "text-amber-900",
    punto: "bg-amber-500",
  },
  {
    fondo: "bg-violet-50",
    borde: "border-violet-500",
    texto: "text-violet-900",
    punto: "bg-violet-500",
  },
  {
    fondo: "bg-cyan-50",
    borde: "border-cyan-500",
    texto: "text-cyan-900",
    punto: "bg-cyan-500",
  },
  {
    fondo: "bg-rose-50",
    borde: "border-rose-500",
    texto: "text-rose-900",
    punto: "bg-rose-500",
  },
  {
    fondo: "bg-lime-50",
    borde: "border-lime-500",
    texto: "text-lime-900",
    punto: "bg-lime-500",
  },
  {
    fondo: "bg-orange-50",
    borde: "border-orange-500",
    texto: "text-orange-900",
    punto: "bg-orange-500",
  },
];

function colorFinca(
  finca: string,
  fincas: string[]
) {
  const indice =
    Math.max(
      0,
      fincas.indexOf(finca)
    ) %
    coloresFincas.length;

  return coloresFincas[indice];
}

function Tarjeta({
  titulo,
  valor,
  detalle,
  color = "text-[#0F3D1F]",
}: {
  titulo: string;
  valor: number | string;
  detalle?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
      <p className="text-xs font-bold uppercase text-slate-500">
        {titulo}
      </p>
      <p className={`mt-3 text-3xl font-bold ${color}`}>
        {valor}
      </p>
      {detalle && (
        <p className="mt-2 text-sm text-slate-500">
          {detalle}
        </p>
      )}
    </div>
  );
}

function TablaSimple({
  titulo,
  filas,
  total,
}: {
  titulo: string;
  filas: Array<{
    nombre: string;
    total: number;
  }>;
  total: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
      <h2 className="mb-4 text-lg font-bold text-[#0F3D1F]">
        {titulo}
      </h2>

      {filas.length === 0 ? (
        <p className="text-sm text-slate-500">
          Sin datos para este mes.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filas.map((fila) => (
            <div
              key={fila.nombre}
              className="rounded-lg border bg-slate-50 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">
                  {fila.nombre}
                </span>
                <span className="text-sm font-bold text-[#0F3D1F]">
                  {fila.total}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-[#0F3D1F]"
                  style={{
                    width:
                      calcularPorcentaje(
                        fila.total,
                        total
                      ),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EstadoBadge({
  estado,
}: {
  estado: string;
}) {
  const cerrado =
    estado === "CERRADO";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        cerrado
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {cerrado ? "Cerrado" : "Abierto"}
    </span>
  );
}

function FincasActos({
  filas,
  fincas,
  detalles = [],
  titulo = "Actos inseguros por finca",
  subtitulo = "Relaciona cada finca con los actos reportados en el mes.",
}: {
  filas: Array<{
    finca: string;
    acto: string;
    estado: string;
    total: number;
  }>;
  detalles?: Array<{
    id: number;
    consecutivo: string | null;
    finca: string;
    fecha: Date;
    acto: string;
    estado: string;
    vulnerabilidad: string;
    reportadoPor: string;
  }>;
  fincas: string[];
  titulo?: string;
  subtitulo?: string;
}) {
  const detallesPorActo =
    detalles.reduce(
      (mapa, detalle) => {
        const llave =
          `${detalle.finca}||${detalle.acto}`;
        const actuales =
          mapa.get(llave) || [];

        actuales.push(detalle);
        mapa.set(llave, actuales);

        return mapa;
      },
      new Map<
        string,
        typeof detalles
      >()
    );

  const agrupado =
    fincas.map((finca) => {
      const registros =
        filas.filter(
          (fila) =>
            fila.finca === finca
        );

      const total =
        registros.reduce(
          (sumatoria, fila) =>
            sumatoria + fila.total,
          0
        );

      const abiertos =
        registros
          .filter(
            (fila) =>
              fila.estado !==
              "CERRADO"
          )
          .reduce(
            (sumatoria, fila) =>
              sumatoria + fila.total,
            0
          );

      const cerrados =
        registros
          .filter(
            (fila) =>
              fila.estado ===
              "CERRADO"
          )
          .reduce(
            (sumatoria, fila) =>
              sumatoria + fila.total,
            0
          );

      const actos =
        registros.reduce(
          (
            mapa,
            fila
          ) => {
            mapa.set(
              fila.acto,
              (mapa.get(fila.acto) ||
                0) + fila.total
            );

            return mapa;
          },
          new Map<string, number>()
        );

      return {
        finca,
        total,
        abiertos,
        cerrados,
        actos: Array.from(
          actos.entries()
        )
          .map(
            ([
              acto,
              cantidad,
            ]) => ({
              acto,
              cantidad,
            })
          )
        .sort(
            (a, b) =>
              b.cantidad -
              a.cantidad
          ),
      };
    })
    .filter(
      (item) => item.total > 0
    )
    .sort(
      (a, b) =>
        b.total - a.total
    );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0F3D1F]">
            {titulo}
          </h2>
          <p className="text-sm text-slate-500">
            {subtitulo}
          </p>
        </div>
        <span className="text-sm font-semibold text-slate-500">
          Total:{" "}
          {agrupado.reduce(
            (sumatoria, item) =>
              sumatoria +
              item.total,
            0
          )}
        </span>
      </div>

      {agrupado.length === 0 ? (
        <p className="text-sm text-slate-500">
          Sin datos para este mes.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {agrupado.map((item) => {
            const color =
              colorFinca(
                item.finca,
                fincas
              );

            return (
              <div
                key={item.finca}
                className={`rounded-xl border-l-4 ${color.borde} ${color.fondo} p-4`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-3 w-3 rounded-full ${color.punto}`}
                      />
                      <h3
                        className={`text-lg font-bold ${color.texto}`}
                      >
                        {item.finca}
                      </h3>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.total} analisis
                    </p>
                  </div>

                  <div className="flex gap-2 text-xs font-bold">
                    <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">
                      Abiertos {item.abiertos}
                    </span>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">
                      Cerrados {item.cerrados}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {item.actos.map(
                    (acto) => {
                      const analisis =
                        detallesPorActo.get(
                          `${item.finca}||${acto.acto}`
                        ) || [];

                      return (
                        <details
                          key={acto.acto}
                          className="rounded-lg border border-white/70 bg-white/75 p-3"
                        >
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-slate-700">
                              {acto.acto}
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                              {acto.cantidad}
                            </span>
                          </summary>

                          <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">
                            {analisis.length ===
                            0 ? (
                              <p className="text-xs text-slate-500">
                                Sin detalle disponible.
                              </p>
                            ) : (
                              analisis.map(
                                (detalle) => (
                                  <div
                                    key={
                                      detalle.id
                                    }
                                    className="rounded-lg border border-slate-200 bg-white p-3"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <div>
                                        <p className="text-sm font-bold text-[#0F3D1F]">
                                          {detalle.consecutivo ||
                                            `Analisis #${detalle.id}`}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                          {detalle.fecha.toLocaleDateString(
                                            "es-CO",
                                            {
                                              day:
                                                "2-digit",
                                              month:
                                                "2-digit",
                                              year:
                                                "numeric",
                                              timeZone:
                                                "America/Bogota",
                                            }
                                          )}{" "}
                                          | Reportado por:{" "}
                                          {
                                            detalle.reportadoPor
                                          }
                                        </p>
                                      </div>
                                      <EstadoBadge
                                        estado={
                                          detalle.estado
                                        }
                                      />
                                    </div>

                                    <p className="mt-2 text-sm text-slate-700">
                                      {
                                        detalle.vulnerabilidad
                                      }
                                    </p>

                                    <Link
                                      href={`/vulnerabilidades/${detalle.id}`}
                                      className="mt-3 inline-flex rounded-lg bg-[#0F3D1F] px-3 py-2 text-xs font-bold text-white hover:bg-[#0b2d17]"
                                    >
                                      Ver analisis
                                    </Link>
                                  </div>
                                )
                              )
                            )}
                          </div>
                        </details>
                      );
                    }
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EstadoPorFinca({
  titulo,
  filas,
  fincas,
  estado,
}: {
  titulo: string;
  filas: Array<{
    finca: string;
    acto: string;
    estado: string;
    total: number;
  }>;
  fincas: string[];
  estado: "ABIERTO" | "CERRADO";
}) {
  const filtradas =
    filas.filter((fila) =>
      estado === "CERRADO"
        ? fila.estado ===
          "CERRADO"
        : fila.estado !==
          "CERRADO"
    );

  const porFinca =
    fincas
      .map((finca) => {
        const registros =
          filtradas.filter(
            (fila) =>
              fila.finca === finca
          );

        return {
          finca,
          total:
            registros.reduce(
              (sumatoria, fila) =>
                sumatoria +
                fila.total,
              0
            ),
          actos:
            registros
              .map((fila) => ({
                acto: fila.acto,
                total: fila.total,
              }))
              .sort(
                (a, b) =>
                  b.total -
                  a.total
              ),
        };
      })
      .filter(
        (item) => item.total > 0
      )
      .sort(
        (a, b) =>
          b.total - a.total
      );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#0F3D1F]">
          {titulo}
        </h2>
        <EstadoBadge estado={estado} />
      </div>

      {porFinca.length === 0 ? (
        <p className="text-sm text-slate-500">
          Sin datos para este mes.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {porFinca.map((item) => {
            const color =
              colorFinca(
                item.finca,
                fincas
              );

            return (
              <div
                key={item.finca}
                className={`rounded-lg border-l-4 ${color.borde} bg-slate-50 p-3`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`font-bold ${color.texto}`}
                  >
                    {item.finca}
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      estado ===
                      "CERRADO"
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {item.total}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.actos.map(
                    (acto) => (
                      <span
                        key={acto.acto}
                        className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        {acto.acto}:{" "}
                        {acto.total}
                      </span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SupervisoresPorFinca({
  filas,
  fincas,
}: {
  filas: Array<{
    supervisor: string;
    finca: string;
    total: number;
  }>;
  fincas: string[];
}) {
  const supervisores =
    Array.from(
      new Set(
        filas.map(
          (fila) =>
            fila.supervisor
        )
      )
    ).sort((a, b) => {
      const totalA =
        filas
          .filter(
            (fila) =>
              fila.supervisor === a
          )
          .reduce(
            (sumatoria, fila) =>
              sumatoria +
              fila.total,
            0
          );

      const totalB =
        filas
          .filter(
            (fila) =>
              fila.supervisor === b
          )
          .reduce(
            (sumatoria, fila) =>
              sumatoria +
              fila.total,
            0
          );

      return totalB - totalA;
    });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
      <h2 className="mb-4 text-lg font-bold text-[#0F3D1F]">
        Reportes por supervisor y finca
      </h2>

      {supervisores.length === 0 ? (
        <p className="text-sm text-slate-500">
          Sin datos para este mes.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {supervisores.map(
            (supervisor) => {
              const registros =
                filas.filter(
                  (fila) =>
                    fila.supervisor ===
                    supervisor
                )
                .sort(
                  (a, b) =>
                    b.total -
                    a.total
                );

              const total =
                registros.reduce(
                  (
                    sumatoria,
                    fila
                  ) =>
                    sumatoria +
                    fila.total,
                  0
                );

              return (
                <div
                  key={supervisor}
                  className="rounded-xl border bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-slate-800">
                      {supervisor}
                    </h3>
                    <span className="text-lg font-bold text-[#0F3D1F]">
                      {total}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {registros.map(
                      (registro) => {
                        const color =
                          colorFinca(
                            registro.finca,
                            fincas
                          );

                        return (
                          <span
                            key={`${supervisor}-${registro.finca}`}
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${color.fondo} ${color.borde} ${color.texto}`}
                          >
                            {registro.finca}:{" "}
                            {registro.total}
                          </span>
                        );
                      }
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

const coloresActos = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#f59e0b",
  "#0891b2",
  "#7c3aed",
  "#ea580c",
  "#0f766e",
];

function colorActo(
  acto: string,
  actos: string[]
) {
  const indice =
    Math.max(
      0,
      actos.indexOf(acto)
    ) % coloresActos.length;

  return coloresActos[indice];
}

function GraficaActos({
  filas,
  titulo,
  subtitulo,
}: {
  filas: Array<{
    finca: string;
    acto: string;
    estado: string;
    total: number;
  }>;
  titulo: string;
  subtitulo: string;
}) {
  const actos =
    Array.from(
      new Set(
        filas.map(
          (fila) => fila.acto
        )
      )
    ).sort((a, b) =>
      a.localeCompare(b)
    );

  const porFinca =
    Array.from(
      filas.reduce(
        (mapa, fila) => {
          const actual =
            mapa.get(fila.finca) || {
              finca: fila.finca,
              total: 0,
              actos:
                new Map<
                  string,
                  number
                >(),
            };

          actual.total +=
            fila.total;
          actual.actos.set(
            fila.acto,
            (actual.actos.get(
              fila.acto
            ) || 0) +
              fila.total
          );

          mapa.set(
            fila.finca,
            actual
          );

          return mapa;
        },
        new Map<
          string,
          {
            finca: string;
            total: number;
            actos: Map<
              string,
              number
            >;
          }
        >()
      ).values()
    ).sort(
      (a, b) => b.total - a.total
    );

  const maximo =
    Math.max(
      1,
      ...porFinca.flatMap((finca) =>
        actos.map(
          (acto) =>
            finca.actos.get(acto) ||
            0
        )
      )
    );

  const altoGrafica = 260;
  const anchoGrupo =
    Math.max(
      108,
      actos.length * 20 + 42
    );
  const altoContenedor =
    Math.max(
      altoGrafica + 78,
      338
    );
  const anchoMinimo =
    Math.max(
      1120,
      porFinca.length *
        (anchoGrupo + 14) +
        80
    );
  const marcas =
    [1, 0.75, 0.5, 0.25, 0];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">
            Grafica
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-wide text-[#0F3D1F]">
            {titulo}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {subtitulo}
          </p>
        </div>

        <span className="rounded-full bg-[#0F3D1F] px-4 py-2 text-sm font-bold text-white">
          Total{" "}
          {porFinca.reduce(
            (sumatoria, finca) =>
              sumatoria +
              finca.total,
            0
          )}
        </span>
      </div>

      {porFinca.length === 0 ? (
        <p className="text-sm text-slate-500">
          Sin datos para este año.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto pb-3">
            <div
              className="relative rounded-xl border bg-slate-950 p-5 text-white"
              style={{
                minWidth:
                  `${anchoMinimo}px`,
              }}
            >
              <div
                className="absolute left-12 right-5 top-5"
                style={{
                  height:
                    altoGrafica,
                }}
              >
                {marcas.map((marca) => (
                  <div
                    key={marca}
                    className="absolute left-0 right-0 border-t border-white/15"
                    style={{
                      top:
                        (1 - marca) *
                        altoGrafica,
                    }}
                  >
                    <span className="absolute -left-10 -top-2 text-xs text-white/65">
                      {Math.round(
                        maximo * marca
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className="relative ml-10 flex items-end justify-start gap-3"
                style={{
                  height:
                    altoContenedor,
                }}
              >
                {porFinca.map(
                  (finca) => (
                    <div
                      key={finca.finca}
                      className="flex flex-col items-center rounded-lg border border-white/10 bg-white/5 px-2 pb-2 pt-3 shadow-inner"
                      style={{
                        width:
                          `${anchoGrupo}px`,
                      }}
                    >
                      <div
                        className="flex items-end justify-center gap-1"
                        style={{
                          height:
                            altoGrafica,
                        }}
                      >
                        {actos.map(
                          (acto) => {
                            const valor =
                              finca.actos.get(
                                acto
                              ) || 0;

                            const altura =
                              valor
                                ? Math.max(
                                    8,
                                    (valor /
                                      maximo) *
                                      altoGrafica
                                  )
                                : 0;

                            return (
                              <div
                                key={`${finca.finca}-${acto}`}
                                className="flex w-3.5 flex-col items-center justify-end"
                                title={`${finca.finca} - ${acto}: ${valor}`}
                              >
                                {valor > 0 && (
                                  <span className="mb-1 text-[10px] font-bold text-white/85">
                                    {valor}
                                  </span>
                                )}
                                <div
                                  className="w-full rounded-t-sm shadow-lg"
                                  style={{
                                    height:
                                      altura,
                                    backgroundColor:
                                      colorActo(
                                        acto,
                                        actos
                                      ),
                                  }}
                                />
                              </div>
                            );
                          }
                        )}
                      </div>

                      <div className="mt-3 h-px w-full bg-white/15" />

                      <p className="mt-2 max-w-24 text-center text-[11px] font-bold uppercase leading-tight text-white/85">
                        {finca.finca}
                      </p>
                      <span className="mt-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/70">
                        {finca.total}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {actos.map((acto) => (
              <div
                key={acto}
                className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{
                    backgroundColor:
                      colorActo(
                        acto,
                        actos
                      ),
                  }}
                />
                {acto}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default async function MetricasAnalisisPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session =
    await getServerSession(
      authOptions
    );

  const usuario =
    session?.user?.email
      ? await prisma.usuario.findUnique({
        where: {
          email: session.user.email,
        },
        select: {
          nombre: true,
          cargo: true,
          fincaEAI: true,
        },
      })
      : null;
  const esAdministrador =
    session?.user?.role === "ADMIN";
  const esAnalistaConFinca =
    esAnalistaSig(usuario?.cargo) &&
    Boolean(usuario?.fincaEAI);

  if (
    !esAdministrador &&
    !esAnalistaConFinca
  ) {
    redirect("/dashboard");
  }

  const params =
    await searchParams;
  if (esAnalistaConFinca) {
    return <MetricasVulnerabilidadFinca fincas={fincasAsignadasAnalistaSig(usuario)} mes={params.mes} />;
  }

  const mes =
    params.mes || mesActualBogota();
  const anio =
    params.anio || anioActualBogota();
  const {
    inicio,
    fin,
  } = rangoMesBogota(mes);
  const {
    inicio: inicioAnio,
    fin: finAnio,
  } = rangoAnioBogota(anio);
  const whereMes = {
    fecha: {
      gte:
        inicio,
      lt:
        fin,
    },
  };
  const whereAnio = {
    fecha: {
      gte:
        inicioAnio,
      lt:
        finAnio,
    },
  };

  const [
    mesesRaw,
    aniosRaw,
    total,
    abiertos,
    cerrados,
    pendientesAbiertos,
    porEstado,
    porEai,
    porActo,
    porReportadoPor,
    porFincaActoEstado,
    porSupervisorFinca,
    detallesMes,
    totalAnio,
    abiertosAnio,
    cerradosAnio,
    porFincaActoEstadoAnio,
    porSupervisorFincaAnio,
    detallesAnio,
    porEaiAnio,
    porActoAnio,
    totalHistorico,
  ] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        mes: string;
      }>
    >`
      SELECT to_char("fecha", 'YYYY-MM') AS mes
      FROM "VulnerabilidadInforme"
      GROUP BY 1
      ORDER BY mes DESC
    `,
    prisma.$queryRaw<
      Array<{
        anio: string;
      }>
    >`
      SELECT to_char("fecha", 'YYYY') AS anio
      FROM "VulnerabilidadInforme"
      GROUP BY 1
      ORDER BY anio DESC
    `,
    prisma
      .vulnerabilidadInforme
      .count({
        where:
          whereMes,
      }),
    prisma
      .vulnerabilidadInforme
      .count({
        where: {
          ...whereMes,
          estado: {
            not:
              "CERRADO",
          },
        },
      }),
    prisma
      .vulnerabilidadInforme
      .count({
        where: {
          ...whereMes,
          estado:
            "CERRADO",
        },
      }),
    prisma
      .vulnerabilidadInforme
      .findMany({
        where: {
          estado: {
            not:
              "CERRADO",
          },
        },
        select: {
          fecha: true,
          actoInseguro: true,
        },
      }),
    prisma
      .vulnerabilidadInforme
      .groupBy({
        by: ["estado"],
        where:
          whereMes,
        _count: {
          _all: true,
        },
      }),
    prisma
      .vulnerabilidadInforme
      .groupBy({
        by: ["eai"],
        where:
          whereMes,
        _count: {
          _all: true,
        },
        orderBy: {
          _count: {
            eai: "desc",
          },
        },
        take: 10,
      }),
    prisma
      .vulnerabilidadInforme
      .groupBy({
        by: ["actoInseguro"],
        where:
          whereMes,
        _count: {
          _all: true,
        },
        orderBy: {
          _count: {
            actoInseguro:
              "desc",
          },
        },
        take: 10,
      }),
    prisma.$queryRaw<
      Array<{
        nombre: string | null;
        total: bigint;
      }>
    >`
      SELECT
        COALESCE(NULLIF("reportadoPor", ''), "supervisor") AS nombre,
        COUNT(*) AS total
      FROM "VulnerabilidadInforme"
      WHERE "fecha" >= ${inicio}
        AND "fecha" < ${fin}
      GROUP BY
        COALESCE(NULLIF("reportadoPor", ''), "supervisor")
      ORDER BY total DESC
      LIMIT 10
    `,
    prisma.$queryRaw<
      Array<{
        finca: string | null;
        acto: string | null;
        estado: string | null;
        total: bigint;
      }>
    >`
      SELECT
        COALESCE(NULLIF("eai", ''), 'Sin finca') AS finca,
        COALESCE(NULLIF("actoInseguro", ''), 'Sin acto') AS acto,
        COALESCE(NULLIF("estado", ''), 'ABIERTO') AS estado,
        COUNT(*) AS total
      FROM "VulnerabilidadInforme"
      WHERE "fecha" >= ${inicio}
        AND "fecha" < ${fin}
      GROUP BY
        COALESCE(NULLIF("eai", ''), 'Sin finca'),
        COALESCE(NULLIF("actoInseguro", ''), 'Sin acto'),
        COALESCE(NULLIF("estado", ''), 'ABIERTO')
      ORDER BY total DESC, finca ASC, acto ASC
    `,
    prisma.$queryRaw<
      Array<{
        supervisor: string | null;
        finca: string | null;
        total: bigint;
      }>
    >`
      SELECT
        COALESCE(NULLIF("reportadoPor", ''), "supervisor", 'Sin supervisor') AS supervisor,
        COALESCE(NULLIF("eai", ''), 'Sin finca') AS finca,
        COUNT(*) AS total
      FROM "VulnerabilidadInforme"
      WHERE "fecha" >= ${inicio}
        AND "fecha" < ${fin}
      GROUP BY
        COALESCE(NULLIF("reportadoPor", ''), "supervisor", 'Sin supervisor'),
        COALESCE(NULLIF("eai", ''), 'Sin finca')
      ORDER BY total DESC, supervisor ASC, finca ASC
    `,
    prisma
      .vulnerabilidadInforme
      .findMany({
        where:
          whereMes,
        select: {
          id: true,
          consecutivo: true,
          eai: true,
          fecha: true,
          actoInseguro: true,
          estado: true,
          vulnerabilidad: true,
          reportadoPor: true,
          supervisor: true,
        },
        orderBy: [
          {
            fecha: "desc",
          },
          {
            id: "desc",
          },
        ],
      }),
    prisma
      .vulnerabilidadInforme
      .count({
        where:
          whereAnio,
      }),
    prisma
      .vulnerabilidadInforme
      .count({
        where: {
          ...whereAnio,
          estado: {
            not:
              "CERRADO",
          },
        },
      }),
    prisma
      .vulnerabilidadInforme
      .count({
        where: {
          ...whereAnio,
          estado:
            "CERRADO",
        },
      }),
    prisma.$queryRaw<
      Array<{
        finca: string | null;
        acto: string | null;
        estado: string | null;
        total: bigint;
      }>
    >`
      SELECT
        COALESCE(NULLIF("eai", ''), 'Sin finca') AS finca,
        COALESCE(NULLIF("actoInseguro", ''), 'Sin acto') AS acto,
        COALESCE(NULLIF("estado", ''), 'ABIERTO') AS estado,
        COUNT(*) AS total
      FROM "VulnerabilidadInforme"
      WHERE "fecha" >= ${inicioAnio}
        AND "fecha" < ${finAnio}
      GROUP BY
        COALESCE(NULLIF("eai", ''), 'Sin finca'),
        COALESCE(NULLIF("actoInseguro", ''), 'Sin acto'),
        COALESCE(NULLIF("estado", ''), 'ABIERTO')
      ORDER BY total DESC, finca ASC, acto ASC
    `,
    prisma.$queryRaw<
      Array<{
        supervisor: string | null;
        finca: string | null;
        total: bigint;
      }>
    >`
      SELECT
        COALESCE(NULLIF("reportadoPor", ''), "supervisor", 'Sin supervisor') AS supervisor,
        COALESCE(NULLIF("eai", ''), 'Sin finca') AS finca,
        COUNT(*) AS total
      FROM "VulnerabilidadInforme"
      WHERE "fecha" >= ${inicioAnio}
        AND "fecha" < ${finAnio}
      GROUP BY
        COALESCE(NULLIF("reportadoPor", ''), "supervisor", 'Sin supervisor'),
        COALESCE(NULLIF("eai", ''), 'Sin finca')
      ORDER BY total DESC, supervisor ASC, finca ASC
    `,
    prisma
      .vulnerabilidadInforme
      .findMany({
        where:
          whereAnio,
        select: {
          id: true,
          consecutivo: true,
          eai: true,
          fecha: true,
          actoInseguro: true,
          estado: true,
          vulnerabilidad: true,
          reportadoPor: true,
          supervisor: true,
        },
        orderBy: [
          {
            fecha: "desc",
          },
          {
            id: "desc",
          },
        ],
      }),
    prisma
      .vulnerabilidadInforme
      .groupBy({
        by: ["eai"],
        where:
          whereAnio,
        _count: {
          _all: true,
        },
        orderBy: {
          _count: {
            eai: "desc",
          },
        },
      }),
    prisma
      .vulnerabilidadInforme
      .groupBy({
        by: ["actoInseguro"],
        where:
          whereAnio,
        _count: {
          _all: true,
        },
        orderBy: {
          _count: {
            actoInseguro:
              "desc",
          },
        },
      }),
    prisma
      .vulnerabilidadInforme
      .count(),
  ]);

  const mapearFincaActoEstado = (
    filas: Array<{
      finca: string | null;
      acto: string | null;
      estado: string | null;
      total: bigint;
    }>
  ) =>
    filas.map((item) => ({
      finca:
        item.finca ||
        "Sin finca",
      acto:
        item.acto ||
        "Sin acto",
      estado:
        String(
          item.estado ||
            "ABIERTO"
        )
          .trim()
          .toUpperCase(),
      total:
        Number(item.total),
    }));

  const mapearSupervisorFinca = (
    filas: Array<{
      supervisor: string | null;
      finca: string | null;
      total: bigint;
    }>
  ) =>
    filas.map((item) => ({
      supervisor:
        item.supervisor ||
        "Sin supervisor",
      finca:
        item.finca ||
        "Sin finca",
      total:
        Number(item.total),
    }));

  const mapearDetalles = (
    filas: Array<{
      id: number;
      consecutivo: string | null;
      eai: string;
      fecha: Date;
      actoInseguro: string;
      estado: string;
      vulnerabilidad: string;
      reportadoPor: string | null;
      supervisor: string;
    }>
  ) =>
    filas.map((item) => ({
      id:
        item.id,
      consecutivo:
        item.consecutivo,
      finca:
        item.eai ||
        "Sin finca",
      fecha:
        item.fecha,
      acto:
        item.actoInseguro ||
        "Sin acto",
      estado:
        String(
          item.estado ||
            "ABIERTO"
        )
          .trim()
          .toUpperCase(),
      vulnerabilidad:
        item.vulnerabilidad,
      reportadoPor:
        item.reportadoPor ||
        item.supervisor ||
        "Sin supervisor",
    }));

  const fincaActoEstado =
    mapearFincaActoEstado(
      porFincaActoEstado
    );

  const pendientesVencidos =
    pendientesAbiertos.filter((informe) =>
      estaVencidoCierreVulnerabilidad(
        informe.fecha,
        informe.actoInseguro
      )
    ).length;

  const supervisorFinca =
    mapearSupervisorFinca(
      porSupervisorFinca
    );

  const detallesFincaActo =
    mapearDetalles(
      detallesMes
    );

  const fincaActoEstadoAnio =
    mapearFincaActoEstado(
      porFincaActoEstadoAnio
    );

  const supervisorFincaAnio =
    mapearSupervisorFinca(
      porSupervisorFincaAnio
    );

  const detallesFincaActoAnio =
    mapearDetalles(
      detallesAnio
    );

  const fincas =
    Array.from(
      new Set(
        fincaActoEstado
          .map((item) => item.finca)
          .concat(
            supervisorFinca.map(
              (item) => item.finca
            )
          )
          .concat(
            fincaActoEstadoAnio.map(
              (item) => item.finca
            )
          )
          .concat(
            supervisorFincaAnio.map(
              (item) => item.finca
            )
          )
      )
    ).sort((a, b) =>
      a.localeCompare(b)
    );

  const meses =
    mesesRaw.length > 0
      ? mesesRaw
      : [{ mes }];

  const anios =
    aniosRaw.length > 0
      ? aniosRaw
      : [{ anio }];

  const modoAnual =
    Boolean(params.anio) &&
    !params.mes;

  return (
    <div className="min-h-screen bg-[#E8EEF2] p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F3D1F]">
          Metricas analisis
        </h1>
        <p className="mt-2 text-slate-600">
          Indicadores mensuales y acumulados anuales de analisis de vulnerabilidad.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-md xl:grid-cols-2">
        <form className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase text-slate-500">
              Mes
            </label>
            <select
              name="mes"
              defaultValue={mes}
              className="min-w-56 rounded-lg border p-3"
            >
              {meses.map((item) => (
                <option
                  key={item.mes}
                  value={item.mes}
                >
                  {etiquetaMes(item.mes)}
                </option>
              ))}
            </select>
          </div>

        <button
          type="submit"
          className="rounded-lg bg-[#0F3D1F] px-5 py-3 text-sm font-bold text-white hover:bg-[#14532d]"
        >
          Ver mes
        </button>
        </form>

        <form className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase text-slate-500">
            Año
          </label>
          <select
            name="anio"
            defaultValue={anio}
            className="min-w-40 rounded-lg border p-3"
          >
            {anios.map((item) => (
              <option
                key={item.anio}
                value={item.anio}
              >
                {item.anio}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-[#0F3D1F] px-5 py-3 text-sm font-bold text-white hover:bg-[#14532d]"
        >
          Ver año completo
        </button>
      </form>
      </div>

      <div className={modoAnual ? "hidden" : "block"}>
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-md">
        <p className="text-xs font-bold uppercase text-slate-500">
          Vista mensual
        </p>
        <h2 className="mt-1 text-xl font-bold text-[#0F3D1F]">
          {etiquetaMes(mes)}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Tarjeta
          titulo="Analisis del mes"
          valor={total}
          detalle={etiquetaMes(mes)}
        />
        <Tarjeta
          titulo="Abiertos"
          valor={abiertos}
          detalle={`${calcularPorcentaje(abiertos, total)} del mes`}
          color="text-yellow-700"
        />
        <Tarjeta
          titulo="Cerrados"
          valor={cerrados}
          detalle={`${calcularPorcentaje(cerrados, total)} del mes`}
          color="text-green-700"
        />
        <Tarjeta
          titulo="Pendientes vencidos"
          valor={pendientesVencidos}
          detalle="Abiertos fuera de su plazo de cierre"
          color="text-red-700"
        />
      </div>

      <div className="mt-4">
        <GraficaActos
          filas={fincaActoEstado}
          titulo={`Actos inseguros ${etiquetaMes(mes)}`}
          subtitulo="Barras agrupadas por finca y tipo de acto inseguro del mes seleccionado."
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Tarjeta
          titulo="Historico total"
          valor={totalHistorico}
          detalle="Todos los analisis cargados"
        />
        <TablaSimple
          titulo="Estado del mes"
          total={total}
          filas={porEstado.map(
            (item) => ({
              nombre:
                item.estado ||
                "Sin estado",
              total:
                item._count._all,
            })
          )}
        />
      </div>

      <div className="mt-4">
        <FincasActos
          filas={fincaActoEstado}
          fincas={fincas}
          detalles={detallesFincaActo}
          titulo="Actos inseguros por finca del mes"
          subtitulo="Ordenado desde la finca con mas analisis hasta la de menor volumen."
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <EstadoPorFinca
          titulo="Abiertos por finca"
          filas={fincaActoEstado}
          fincas={fincas}
          estado="ABIERTO"
        />

        <EstadoPorFinca
          titulo="Cerrados por finca"
          filas={fincaActoEstado}
          fincas={fincas}
          estado="CERRADO"
        />
      </div>

      <div className="mt-4">
        <SupervisoresPorFinca
          filas={supervisorFinca}
          fincas={fincas}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <TablaSimple
          titulo="Fincas con mas analisis del mes"
          total={total}
          filas={porEai.map(
            (item) => ({
              nombre:
                item.eai ||
                "Sin finca",
              total:
                item._count._all,
            })
          )}
        />
        <TablaSimple
          titulo="Actos inseguros del mes"
          total={total}
          filas={porActo.map(
            (item) => ({
              nombre:
                item.actoInseguro ||
                "Sin acto",
              total:
                item._count._all,
            })
          )}
        />
        <TablaSimple
          titulo="Reportados por del mes"
          total={total}
          filas={porReportadoPor.map(
            (item) => ({
              nombre:
                item.nombre ||
                "Sin supervisor",
              total:
                Number(item.total),
            })
          )}
        />
      </div>

      </div>

      <div className={modoAnual ? "block" : "hidden"}>
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-md">
        <p className="text-xs font-bold uppercase text-slate-500">
          Vista anual
        </p>
        <h2 className="mt-1 text-xl font-bold text-[#0F3D1F]">
          Acumulado {anio}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Agrupa todos los analisis del año seleccionado y los ordena por mayor cantidad.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Tarjeta
          titulo="Analisis del año"
          valor={totalAnio}
          detalle={`Acumulado ${anio}`}
        />
        <Tarjeta
          titulo="Abiertos del año"
          valor={abiertosAnio}
          detalle={`${calcularPorcentaje(abiertosAnio, totalAnio)} del año`}
          color="text-red-700"
        />
        <Tarjeta
          titulo="Cerrados del año"
          valor={cerradosAnio}
          detalle={`${calcularPorcentaje(cerradosAnio, totalAnio)} del año`}
          color="text-green-700"
        />
      </div>

      <div className="mt-4">
        <GraficaActos
          filas={fincaActoEstadoAnio}
          titulo={`Actos inseguros ${anio}`}
          subtitulo="Barras agrupadas por finca y tipo de acto inseguro del año seleccionado."
        />
      </div>

      <div className="mt-4">
        <FincasActos
          filas={fincaActoEstadoAnio}
          fincas={fincas}
          detalles={detallesFincaActoAnio}
          titulo="Actos inseguros por finca del año"
          subtitulo="Acumulado anual ordenado desde la finca con mas analisis hasta la de menor volumen."
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <EstadoPorFinca
          titulo="Abiertos del año por finca"
          filas={fincaActoEstadoAnio}
          fincas={fincas}
          estado="ABIERTO"
        />

        <EstadoPorFinca
          titulo="Cerrados del año por finca"
          filas={fincaActoEstadoAnio}
          fincas={fincas}
          estado="CERRADO"
        />
      </div>

      <div className="mt-4">
        <SupervisoresPorFinca
          filas={supervisorFincaAnio}
          fincas={fincas}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TablaSimple
          titulo="Fincas con mas analisis del año"
          total={totalAnio}
          filas={porEaiAnio.map(
            (item) => ({
              nombre:
                item.eai ||
                "Sin finca",
              total:
                item._count._all,
            })
          )}
        />
        <TablaSimple
          titulo="Actos inseguros del año"
          total={totalAnio}
          filas={porActoAnio.map(
            (item) => ({
              nombre:
                item.actoInseguro ||
                "Sin acto",
              total:
                item._count._all,
            })
          )}
        />
      </div>
      </div>
    </div>
  );
}
