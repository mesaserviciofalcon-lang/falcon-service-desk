import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import GestionEquipoAdministrativo from "@/components/GestionEquipoAdministrativo";
import { authOptions } from "@/lib/auth";
import {
  puedeAdministrarAnuario,
  puedeVerAnuario,
} from "@/lib/permisosAnuario";
import { prisma } from "@/lib/prisma";

export default async function EquipoAdministrativoPage() {
  const session = await getServerSession(authOptions);
  const datosAcceso = {
    rol: session?.user?.role,
    cargo: session?.user?.cargo,
    nombre: session?.user?.name,
  };

  if (!puedeVerAnuario(datosAcceso)) {
    redirect("/dashboard");
  }

  const integrantes = await prisma.equipoAdministrativo.findMany({
    orderBy: [{ nombres: "asc" }, { apellidos: "asc" }],
  });
  const puedeAdministrar = puedeAdministrarAnuario(datosAcceso);

  return (
    <div className="min-h-screen bg-[#E8EEF2] p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F3D1F]">
          Equipo Administrativo
        </h1>
        <p className="mt-2 text-slate-600">
          Directorio visual del equipo administrativo.
        </p>
      </div>

      {puedeAdministrar && <GestionEquipoAdministrativo />}

      {integrantes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Aún no hay integrantes registrados.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {integrantes.map((integrante) => (
            <article
              key={integrante.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
            >
              <img
                src={integrante.fotoUrl}
                alt={`Foto de ${integrante.nombres} ${integrante.apellidos}`}
                className="h-72 w-full object-cover object-top"
              />
              <div className="p-5">
                <h2 className="text-lg font-bold text-[#0F3D1F]">
                  {integrante.nombres} {integrante.apellidos}
                </h2>
                <p className="mt-1 text-sm font-medium text-emerald-700">
                  {integrante.cargo}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
