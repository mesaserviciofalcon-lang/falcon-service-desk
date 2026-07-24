import { getServerSession }
from "next-auth";

import { redirect }
from "next/navigation";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

import GestionUsuarios
from "@/components/GestionUsuarios";

export default async function UsuariosPage() {
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

  const usuarios =
    await prisma.usuario.findMany({

      orderBy: {
        nombre: "asc",
      },

      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        fincaEAI: true,
        activo: true,
      },
    });

  return (
    <div className="p-8 bg-[#E8EEF2] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F3D1F]">
          Gestion de usuarios
        </h1>
        <p className="mt-2 text-gray-600">
          Cree, edite, active, desactive o elimine usuarios del sistema.
        </p>
      </div>

      <GestionUsuarios
        usuarios={usuarios}
        usuarioActualId={
          session.user.id
        }
      />
    </div>
  );
}
