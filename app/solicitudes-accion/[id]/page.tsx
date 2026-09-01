import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import FormularioSac from "@/components/FormularioSac";
import { authOptions } from "@/lib/auth";
import { mismaFincaSimulacro } from "@/lib/simulacros";
import { prisma } from "@/lib/prisma";

export default async function SolicitudAccionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const simulacro = await prisma.simulacroActividad.findUnique({ where: { id: Number(id) }, include: { solicitudAccion: true } });
  if (!simulacro?.requiereSac) notFound();
  const usuario = session?.user?.email ? await prisma.usuario.findUnique({ where: { email: session.user.email }, select: { cargo: true, fincaEAI: true } }) : null;
  const esAnalista = usuario?.cargo === "ANALISTA SIG" && mismaFincaSimulacro(usuario.fincaEAI, simulacro.finca);
  const esAdmin = ["ADMIN", "JEFE_SEG", "DIRECTOR_SEG"].includes(String(session?.user?.role || ""));
  if (!esAnalista && !esAdmin) redirect("/dashboard");
  if (simulacro.solicitudAccion) redirect(`/api/simulacros/${simulacro.id}/sac/pdf`);
  return <FormularioSac simulacro={simulacro} />;
}
