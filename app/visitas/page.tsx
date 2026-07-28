import { redirect }
from "next/navigation";

import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

const rolesConsultaVisitas = [
  "ADMIN",
  "VISITA",
];

function formatearFechaSoloDia(
  fecha?: Date | string | null
) {
  if (!fecha) {
    return "";
  }

  return new Date(fecha).toLocaleDateString(
    "es-CO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Bogota",
    }
  );
}

function obtenerResultadoVisita(
  valor?: string | null
) {
  const texto =
    String(valor || "").trim();

  if (!texto) {
    return "Sin resultado";
  }

  if (
    texto.toUpperCase().includes(
      "CANCEL"
    )
  ) {
    return texto;
  }

  return "Realizada";
}

export default async function VisitasPage({
  searchParams,
}: {
  searchParams: Promise<{
    cedula?: string;
  }>;
}) {
  const session =
    await getServerSession(
      authOptions
    );

  if (
    !rolesConsultaVisitas.includes(
      session?.user?.role || ""
    )
  ) {
    redirect("/dashboard");
  }

  const params =
    await searchParams;

  const cedula =
    (params.cedula || "")
      .replace(/\D/g, "")
      .trim();

  const registros =
    cedula.length >= 5
      ? await prisma.visitaHistorica.findMany({
          where: {
            cedula,
          },
          select: {
            id: true,
            fechaVisitaDate: true,
            fechaVisitaRealizada: true,
            fincaEAI: true,
            cedula: true,
            nombresApellidos: true,
            solicitanteNombre: true,
            correoSolicitante: true,
          },
          orderBy: [
            {
              fechaVisitaDate: {
                sort: "desc",
                nulls: "last",
              },
            },
            {
              id: "desc",
            },
          ],
          take: 100,
        })
      : [];

  return (
    <div className="min-h-screen bg-[#E8EEF2] p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F3D1F]">
          Consulta de visitas
        </h1>

        <p className="mt-2 text-gray-600">
          Busque por cedula para consultar el historial de visitas domiciliarias.
        </p>
      </div>

      <form className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-md md:flex-row">
        <input
          name="cedula"
          defaultValue={cedula}
          placeholder="Numero de cedula"
          className="flex-1 rounded-lg border p-3"
        />

        <button
          type="submit"
          className="rounded-lg bg-[#0F3D1F] px-6 py-3 font-semibold text-white hover:bg-[#14532d]"
        >
          Buscar
        </button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">
            Resultados
          </h2>

          {cedula && (
            <span className="text-sm text-gray-500">
              {registros.length} registro(s)
            </span>
          )}
        </div>

        {!cedula && (
          <p className="text-gray-500">
            Ingrese una cedula para consultar.
          </p>
        )}

        {cedula &&
          cedula.length < 5 && (
          <p className="text-gray-500">
            Ingrese al menos 5 digitos para consultar.
          </p>
        )}

        {cedula &&
          cedula.length >= 5 &&
          registros.length === 0 && (
          <p className="text-gray-500">
            No se encontraron visitas para esta cedula.
          </p>
        )}

        {registros.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="hidden grid-cols-[120px_1.2fr_1fr_1fr_1fr_1.2fr] gap-3 border-b bg-slate-100 px-4 py-3 text-xs font-bold uppercase text-slate-600 xl:grid">
              <span>Fecha</span>
              <span>Resultado</span>
              <span>EAI/Finca</span>
              <span>Cedula</span>
              <span>Candidato</span>
              <span>Quien solicita</span>
            </div>

            {registros.map((registro) => (
              <div
                key={registro.id}
                className="grid gap-2 border-b px-4 py-4 text-sm last:border-b-0 xl:grid-cols-[120px_1.2fr_1fr_1fr_1fr_1.2fr] xl:items-center xl:gap-3"
              >
                <div className="font-semibold text-[#0F3D1F]">
                  {registro.fechaVisitaDate
                    ? formatearFechaSoloDia(
                        registro.fechaVisitaDate
                      )
                    : registro.fechaVisitaRealizada ||
                      "Sin fecha"}
                </div>

                <div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {obtenerResultadoVisita(
                      registro.fechaVisitaRealizada
                    )}
                  </span>
                </div>

                <div>
                  {registro.fincaEAI ||
                    "Sin finca"}
                </div>

                <div>
                  {registro.cedula}
                </div>

                <div className="truncate">
                  {registro.nombresApellidos ||
                    "Sin nombre"}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {registro.solicitanteNombre ||
                      "Sin solicitante"}
                  </p>

                  {registro.correoSolicitante && (
                    <p className="truncate text-xs text-gray-500">
                      {registro.correoSolicitante}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
