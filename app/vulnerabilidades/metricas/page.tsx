import { redirect }
from "next/navigation";

import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

type SearchParams = {
  mes?: string;
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
}: {
  filas: Array<{
    finca: string;
    acto: string;
    estado: string;
    total: number;
  }>;
  fincas: string[];
}) {
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
    });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0F3D1F]">
            Actos inseguros por finca
          </h2>
          <p className="text-sm text-slate-500">
            Relaciona cada finca con los actos reportados en el mes.
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
                    (acto) => (
                      <div
                        key={acto.acto}
                        className="rounded-lg border border-white/70 bg-white/75 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-slate-700">
                            {acto.acto}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {acto.cantidad}
                          </span>
                        </div>
                      </div>
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
    );

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

export default async function MetricasAnalisisPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session =
    await getServerSession(
      authOptions
    );

  if (
    session?.user?.role !==
    "ADMIN"
  ) {
    redirect("/dashboard");
  }

  const params =
    await searchParams;
  const mes =
    params.mes || mesActualBogota();
  const {
    inicio,
    fin,
  } = rangoMesBogota(mes);
  const whereMes = {
    fecha: {
      gte:
        inicio,
      lt:
        fin,
    },
  };

  const [
    mesesRaw,
    total,
    abiertos,
    cerrados,
    pendientes8,
    porEstado,
    porEai,
    porActo,
    porReportadoPor,
    porFincaActoEstado,
    porSupervisorFinca,
    totalHistorico,
  ] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        mes: string;
      }>
    >`
      SELECT to_char("fecha", 'YYYY-MM') AS mes
      FROM "VulnerabilidadInforme"
      GROUP BY mes
      ORDER BY mes DESC
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
      .count({
        where: {
          estado: {
            not:
              "CERRADO",
          },
          fecha: {
            lte:
              new Date(
                Date.now() -
                8 *
                  24 *
                  60 *
                  60 *
                  1000
              ),
          },
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
      GROUP BY nombre
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
      GROUP BY finca, acto, estado
      ORDER BY finca ASC, total DESC, acto ASC
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
      ORDER BY supervisor ASC, total DESC, finca ASC
    `,
    prisma
      .vulnerabilidadInforme
      .count(),
  ]);

  const fincaActoEstado =
    porFincaActoEstado.map(
      (item) => ({
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
      })
    );

  const supervisorFinca =
    porSupervisorFinca.map(
      (item) => ({
        supervisor:
          item.supervisor ||
          "Sin supervisor",
        finca:
          item.finca ||
          "Sin finca",
        total:
          Number(item.total),
      })
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
      )
    ).sort((a, b) =>
      a.localeCompare(b)
    );

  const meses =
    mesesRaw.length > 0
      ? mesesRaw
      : [{ mes }];

  return (
    <div className="min-h-screen bg-[#E8EEF2] p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F3D1F]">
          Metricas analisis
        </h1>
        <p className="mt-2 text-slate-600">
          Indicadores mensuales de analisis de vulnerabilidad.
        </p>
      </div>

      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-md">
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
          Ver metricas
        </button>
      </form>

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
          titulo="Pendientes +8 dias"
          valor={pendientes8}
          detalle="Abiertos fuera del plazo"
          color="text-red-700"
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
          titulo="Fincas con mas analisis"
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
          titulo="Actos inseguros"
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
          titulo="Reportados por"
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
  );
}
