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
    porSupervisor,
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
    prisma
      .vulnerabilidadInforme
      .groupBy({
        by: ["supervisor"],
        where:
          whereMes,
        _count: {
          _all: true,
        },
        orderBy: {
          _count: {
            supervisor:
              "desc",
          },
        },
        take: 10,
      }),
    prisma
      .vulnerabilidadInforme
      .count(),
  ]);

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
          filas={porSupervisor.map(
            (item) => ({
              nombre:
                item.supervisor ||
                "Sin supervisor",
              total:
                item._count._all,
            })
          )}
        />
      </div>
    </div>
  );
}
