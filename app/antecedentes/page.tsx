import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

import {
  puedeImportarHistoricoAntecedentes,
  puedeVerAntecedenteCompleto,
} from "@/lib/antecedentesCatalogos";

import ImportarHistoricoAntecedentes
from "@/components/ImportarHistoricoAntecedentes";

export default async function AntecedentesPage({
  searchParams,
}: {
  searchParams: Promise<{
    identificacion?: string;
  }>;
}) {
  const session =
    await getServerSession(
      authOptions
    );

  const params =
    await searchParams;

  const identificacion =
    params.identificacion?.trim() || "";

  const puedeVerCompleto =
    puedeVerAntecedenteCompleto(
      session?.user?.role
    );

  const puedeImportarHistorico =
    puedeImportarHistoricoAntecedentes(
      session?.user?.role
    );

  const registros =
    identificacion
      ? await prisma.antecedenteRegistro.findMany({

          where: {
            identificacion: {
              contains: identificacion,
              mode: "insensitive",
            },
            eai:
              puedeVerCompleto
                ? undefined
                : session?.user
                    ?.fincaEAI || "",
          },

          include: {
            solicitud: {
              include: {
                antecedente: true,
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        })
      : [];

  return (
    <div className="p-8 bg-[#F4F6F8] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F3D1F]">
          Consulta de antecedentes
        </h1>
        <p className="text-gray-600 mt-2">
          Busque por numero de identificacion para ver el historial registrado.
        </p>
      </div>

      <form
        className="mb-6 flex flex-col gap-3 rounded-xl bg-white p-5 shadow-md md:flex-row"
      >
        <input
          name="identificacion"
          defaultValue={identificacion}
          placeholder="Numero de identificacion"
          className="flex-1 rounded-lg border p-3"
        />

        <button
          type="submit"
          className="rounded-lg bg-black px-6 py-3 text-white hover:bg-gray-800"
        >
          Buscar
        </button>
      </form>

      {puedeImportarHistorico && (
        <ImportarHistoricoAntecedentes />
      )}

      <div className="rounded-xl bg-white p-5 shadow-md">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">
            Resultados
          </h2>

          {identificacion && (
            <span className="text-sm text-gray-500">
              {registros.length} registro(s)
            </span>
          )}
        </div>

        {!identificacion && (
          <p className="text-gray-500">
            Ingrese una identificacion para consultar.
          </p>
        )}

        {identificacion &&
          registros.length === 0 && (
          <p className="text-gray-500">
            No se encontraron registros.
          </p>
        )}

        {registros.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left">
                    Fecha solicitud
                  </th>
                  {puedeVerCompleto && (
                    <th className="border p-2 text-left">
                      Fecha respuesta
                    </th>
                  )}
                  {puedeVerCompleto && (
                    <th className="border p-2 text-left">
                      EAI
                    </th>
                  )}
                  <th className="border p-2 text-left">
                    Identificacion
                  </th>
                  <th className="border p-2 text-left">
                    Nombres y apellidos
                  </th>
                  {puedeVerCompleto && (
                    <th className="border p-2 text-left">
                      Tipo documento
                    </th>
                  )}
                  {puedeVerCompleto && (
                    <th className="border p-2 text-left">
                      Fecha expedicion
                    </th>
                  )}
                  <th className="border p-2 text-left">
                    Observacion
                  </th>
                  {puedeVerCompleto && (
                    <>
                      <th className="border p-2 text-left">
                        Revisado por
                      </th>
                      <th className="border p-2 text-left">
                        Motivo
                      </th>
                      <th className="border p-2 text-left">
                        Autorizacion
                      </th>
                      <th className="border p-2 text-left">
                        Observaciones
                      </th>
                      <th className="border p-2 text-left">
                        Ticket
                      </th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody>
                {registros.map((registro) => (
                  <tr key={registro.id}>
                    <td className="border p-2">
                      {registro.fechaSolicitud || ""}
                    </td>
                    {puedeVerCompleto && (
                      <td className="border p-2">
                        {registro.fechaRespuesta || ""}
                      </td>
                    )}
                    {puedeVerCompleto && (
                      <td className="border p-2">
                        {registro.eai || ""}
                      </td>
                    )}
                    <td className="border p-2">
                      {registro.identificacion}
                    </td>
                    <td className="border p-2">
                      {registro.nombresApellidos || ""}
                    </td>
                    {puedeVerCompleto && (
                      <td className="border p-2">
                        {registro.tipoDocumento || ""}
                      </td>
                    )}
                    {puedeVerCompleto && (
                      <td className="border p-2">
                        {
                          registro
                            .fechaExpedicionDocumento ||
                          ""
                        }
                      </td>
                    )}
                    <td className="border p-2">
                      {registro.observacion || ""}
                    </td>
                    {puedeVerCompleto && (
                      <>
                        <td className="border p-2">
                          {registro.revisadoPor || ""}
                        </td>
                        <td className="border p-2">
                          {registro.motivo || ""}
                        </td>
                        <td className="border p-2">
                          {registro.autorizacion || ""}
                        </td>
                        <td className="border p-2">
                          {registro.observaciones || ""}
                        </td>
                        <td className="border p-2">
                          {registro.solicitud
                            .antecedente
                            ?.fincaEAI ===
                          "HISTORICO"
                            ? "Historico"
                            : (
                              <a
                                href={`/tickets/${registro.solicitudId}`}
                                className="text-blue-600 underline"
                              >
                                #{registro.solicitudId}
                              </a>
                            )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
