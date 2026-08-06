import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

import {
  puedeEditarConsultaAntecedentes,
  puedeImportarHistoricoAntecedentes,
  puedeVerAntecedenteCompleto,
} from "@/lib/antecedentesCatalogos";

import ImportarHistoricoAntecedentes
from "@/components/ImportarHistoricoAntecedentes";

import FormularioAntecedenteManual
from "@/components/FormularioAntecedenteManual";

import ConsultaAntecedentesResultados
from "@/components/ConsultaAntecedentesResultados";

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
    (params.identificacion || "")
      .replace(/\D/g, "")
      .trim();

  const puedeVerCompleto =
    puedeVerAntecedenteCompleto(
      session?.user?.role
    );

  const puedeImportarHistorico =
    puedeImportarHistoricoAntecedentes(
      session?.user?.role
    );

  const puedeEditarConsulta =
    puedeEditarConsultaAntecedentes(
      session?.user?.role
    );

  const registros =
    identificacion.length >= 5
      ? await prisma.antecedenteRegistro.findMany({

          where: {
            identificacion,
            eai:
              puedeVerCompleto
                ? undefined
                : session?.user
                    ?.fincaEAI || "",
          },

          select: {
            id: true,
            solicitudId: true,
            fechaSolicitud: true,
            fechaRespuesta: true,
            eai: true,
            nombresApellidos: true,
            tipoDocumento: true,
            identificacion: true,
            fechaExpedicionDocumento: true,
            observacion: true,
            revisadoPor: true,
            motivo: true,
            autorizacion: true,
            observaciones: true,
            solicitud: {
              select: {
                antecedente: {
                  select: {
                    fincaEAI: true,
                  },
                },
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },

          take: 100,
        })
      : [];

  return (
    <div className="p-8 bg-[#E8EEF2] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F3D1F]">
          Consulta de antecedentes
        </h1>
        <p className="text-gray-600 mt-2">
          Busque por numero de identificacion para ver el historial registrado.
        </p>
      </div>

      <form
        className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-md md:flex-row"
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

      {puedeVerCompleto && (
        <FormularioAntecedenteManual />
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
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
          identificacion.length < 5 && (
          <p className="text-gray-500">
            Ingrese al menos 5 digitos para consultar.
          </p>
        )}

        {identificacion &&
          identificacion.length >= 5 &&
          registros.length === 0 && (
          <p className="text-gray-500">
            No se encontraron registros.
          </p>
        )}

        {registros.length > 0 && (
          <ConsultaAntecedentesResultados
            registros={registros}
            puedeEditar={
              puedeEditarConsulta
            }
            puedeVerCompleto={
              puedeVerCompleto
            }
          />
        )}
      </div>
    </div>
  );
}
