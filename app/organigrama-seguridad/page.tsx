import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { puedeVerOrganigramaSeguridad } from "@/lib/permisosAnuario";
import { prisma } from "@/lib/prisma";

type Integrante = {
  id: number;
  nombres: string;
  apellidos: string;
  cargo: string;
  fotoUrl: string;
};

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function perteneceACargo(
  integrante: Integrante,
  palabras: string[]
) {
  const cargo = normalizar(integrante.cargo);
  return palabras.every((palabra) =>
    cargo.includes(palabra)
  );
}

function TarjetaOrganigrama({
  integrante,
  cargoEsperado,
}: {
  integrante?: Integrante;
  cargoEsperado: string;
}) {
  return (
    <article className="w-56 overflow-hidden rounded-2xl bg-white text-center shadow-md ring-1 ring-slate-200">
      {integrante ? (
        <img
          src={integrante.fotoUrl}
          alt={`Foto de ${integrante.nombres} ${integrante.apellidos}`}
          className="h-52 w-full object-cover object-top"
        />
      ) : (
        <div className="flex h-52 items-center justify-center bg-slate-100 px-5 text-sm text-slate-400">
          Foto pendiente
        </div>
      )}
      <div className="min-h-24 p-4">
        <h2 className="font-bold text-[#0F3D1F]">
          {integrante
            ? `${integrante.nombres} ${integrante.apellidos}`
            : "Pendiente por registrar"}
        </h2>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          {integrante?.cargo || cargoEsperado}
        </p>
      </div>
    </article>
  );
}

export default async function OrganigramaSeguridadPage() {
  const session = await getServerSession(authOptions);

  if (
    !puedeVerOrganigramaSeguridad({
      rol: session?.user?.role,
    })
  ) {
    redirect("/dashboard");
  }

  const integrantes = await prisma.equipoAdministrativo.findMany({
    orderBy: [{ nombres: "asc" }, { apellidos: "asc" }],
  });

  const director = integrantes.find((integrante) => {
    const cargo = normalizar(integrante.cargo);
    return (
      cargo.includes("DIRECTOR") &&
      (
        cargo.includes("SEGURIDAD") ||
        cargo.includes("DEPARTAMENTO")
      )
    );
  });
  const jefe = integrantes.find((integrante) =>
    perteneceACargo(integrante, ["JEFE", "SEGURIDAD"])
  );
  const analistaSeguridad = integrantes.find((integrante) =>
    perteneceACargo(integrante, ["ANALISTA", "SEGURIDAD"])
  );
  const analistaOperaciones = integrantes.find((integrante) =>
    perteneceACargo(integrante, ["ANALISTA", "OPERACIONES", "DIGITALES"])
  );
  const supervisores = integrantes
    .filter((integrante) =>
      perteneceACargo(integrante, ["SUPERVISOR"])
    )
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#E8EEF2] p-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-[#0F3D1F]">
          Organigrama Seguridad
        </h1>
        <p className="mt-2 text-slate-600">
          Estructura del Departamento de Seguridad.
        </p>
      </div>

      <section className="mx-auto flex max-w-7xl flex-col items-center">
        <TarjetaOrganigrama
          integrante={director}
          cargoEsperado="Director del Departamento"
        />

        <div className="h-10 w-px bg-emerald-700" />
        <div className="h-px w-2/3 max-w-3xl bg-emerald-700" />

        <div className="grid w-full justify-items-center gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center">
            <div className="h-10 w-px bg-emerald-700" />
            <TarjetaOrganigrama
              integrante={jefe}
              cargoEsperado="Jefe de Seguridad"
            />
          </div>
          <div className="flex flex-col items-center">
            <div className="h-10 w-px bg-emerald-700" />
            <TarjetaOrganigrama
              integrante={analistaSeguridad}
              cargoEsperado="Analista de Seguridad"
            />
          </div>
          <div className="flex flex-col items-center">
            <div className="h-10 w-px bg-emerald-700" />
            <TarjetaOrganigrama
              integrante={analistaOperaciones}
              cargoEsperado="Analista Operaciones Digitales"
            />
          </div>
        </div>

        <div className="mt-2 flex flex-col items-center">
          <div className="h-10 w-px bg-emerald-700" />
          <p className="mb-3 rounded-full bg-emerald-800 px-4 py-2 text-sm font-bold text-white">
            Supervisores de Seguridad
          </p>
          <div className="h-px w-2/3 min-w-56 max-w-3xl bg-emerald-700" />
        </div>

        <div className="grid w-full max-w-6xl grid-cols-1 justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="h-8 w-px bg-emerald-700" />
              <TarjetaOrganigrama
                integrante={supervisores[index]}
                cargoEsperado="Supervisor de Seguridad"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center">
          <div className="h-10 w-px bg-emerald-700" />
          <div className="rounded-2xl border-2 border-emerald-800 bg-emerald-50 px-10 py-5 text-center shadow-sm">
            <h2 className="text-xl font-bold text-[#0F3D1F]">
              Cuerpo de Vigilantes
            </h2>
            <p className="mt-1 text-sm text-emerald-800">
              Personal operativo dependiente de los Supervisores de Seguridad.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
