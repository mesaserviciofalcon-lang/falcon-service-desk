import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { enviarCorreo }
from "@/lib/email";

import { prisma }
from "@/lib/prisma";

import {
  cierreVulnerabilidadCorreoTemplate,
  formatearReferenciaVulnerabilidad,
  obtenerCopiasVulnerabilidad,
} from "@/lib/vulnerabilidades";

import {
  puedeGestionarVulnerabilidadesAsignadas,
} from "@/lib/permisosUsuarios";

const rolesSeguridad = [
  "ADMIN",
];

function puedeCerrar(
  informe: {
    analistaSigCorreo: string | null;
  },
  session: any
) {
  const role =
    session?.user?.role || "";
  const email =
    session?.user?.email || "";
  const cargo =
    session?.user?.cargo || "";

  return (
    rolesSeguridad.includes(role) ||
    (
      puedeGestionarVulnerabilidadesAsignadas(
        role,
        cargo
      ) &&
      informe.analistaSigCorreo === email
    )
  );
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const session =
    await getServerSession(
      authOptions
    );

  if (!session?.user?.email) {
    return Response.json(
      {
        error:
          "Debe iniciar sesion",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const params =
      await context.params;
    const id =
      Number(params.id);

    const informe =
      await prisma
        .vulnerabilidadInforme
        .findUnique({
          where: {
            id,
          },
          select: {
            id: true,
            estado: true,
            analistaSigCorreo: true,
            consecutivo: true,
            eai: true,
            fecha: true,
            actoInseguro: true,
            correoSupervisor: true,
            gerenteCorreo: true,
            copiaCorreos: true,
          },
        });

    if (!informe) {
      return Response.json(
        {
          error:
            "Informe no encontrado",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !puedeCerrar(
        informe,
        session
      )
    ) {
      return Response.json(
        {
          error:
            "No tiene permiso para cerrar este analisis",
        },
        {
          status: 403,
        }
      );
    }

    if (
      informe.estado ===
      "CERRADO"
    ) {
      return Response.json(
        {
          error:
            "Este analisis ya se encuentra cerrado",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await request.json();
    const observaciones =
      String(
        body.observaciones || ""
      ).trim();
    const evidencias =
      Array.isArray(body.evidencias)
        ? body.evidencias
        : [];
    const causaRaiz =
      String(
        body.causaRaiz || ""
      ).trim();
    const proceso =
      String(
        body.proceso || ""
      ).trim();
    const planAccionEai =
      String(
        body.planAccionEai || ""
      ).trim();
    const responsables =
      String(
        body.responsables || ""
      ).trim();
    const fechaEjecucion =
      String(
        body.fechaEjecucion || ""
      ).trim();

    if (!observaciones) {
      return Response.json(
        {
          error:
            "Debe registrar observaciones de cierre",
        },
        {
          status: 400,
        }
      );
    }

    if (evidencias.length === 0) {
      return Response.json(
        {
          error:
            "Debe adjuntar evidencia de cierre",
        },
        {
          status: 400,
        }
      );
    }

    const fechaCierre =
      new Date();
    const cerradoPor =
      session.user.name ||
      "Usuario";
    const actualizado =
      await prisma
        .vulnerabilidadInforme
        .update({
          where: {
            id,
          },
          data: {
            estado: "CERRADO",
            cierreObservaciones:
              observaciones,
            cierreEvidencias:
              evidencias,
            causaRaiz:
              causaRaiz || null,
            proceso:
              proceso || null,
            planAccionEai:
              planAccionEai || null,
            responsables:
              responsables || null,
            fechaEjecucion:
              fechaEjecucion || null,
            cerradoPor:
              cerradoPor,
            cerradoPorCorreo:
              session.user.email,
            fechaCierre:
              fechaCierre,
          },
        });

    const referencia =
      formatearReferenciaVulnerabilidad({
        consecutivo:
          informe.consecutivo,
        eai:
          informe.eai,
        fecha:
          informe.fecha,
        id:
          informe.id,
      });
    const destinatarios =
      Array.from(
        new Set(
          [
            informe.correoSupervisor,
            "seguridad@falconfarms.com.co",
            informe.gerenteCorreo,
          ].filter(Boolean) as string[]
        )
      );
    const copiasGuardadas =
      (informe.copiaCorreos || "")
        .split(/[;,]/)
        .map((correo) =>
          correo.trim()
        )
        .filter(Boolean);
    const copias =
      Array.from(
        new Set([
          ...copiasGuardadas,
          ...obtenerCopiasVulnerabilidad(),
        ])
      ).filter(
        (correo) =>
          !destinatarios.includes(
            correo
          )
      );

    if (destinatarios.length > 0) {
      try {
        await enviarCorreo({
          to:
            destinatarios.join(","),
          cc:
            copias.join(","),
          subject:
            `Cierre de analisis de vulnerabilidad ${referencia}`,
          html:
            cierreVulnerabilidadCorreoTemplate({
              referencia,
              eai:
                informe.eai,
              actoInseguro:
                informe.actoInseguro,
              cerradoPor,
              fechaCierre,
            }),
        });
      } catch (error) {
        console.error(
          "No se pudo enviar correo de cierre de vulnerabilidad",
          error
        );
      }
    }

    return Response.json({
      ok: true,
      informe:
        actualizado,
      correoEnviado:
        destinatarios.length > 0,
    });
  } catch (error: any) {
    console.error(error);

    return Response.json(
      {
        error:
          error.message ||
          "Error cerrando analisis",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const session =
    await getServerSession(
      authOptions
    );

  if (
    session?.user?.role !==
    "ADMIN"
  ) {
    return Response.json(
      {
        error:
          "Solo ADMIN puede eliminar analisis de vulnerabilidad",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const params =
      await context.params;
    const id =
      Number(params.id);

    if (!Number.isFinite(id)) {
      return Response.json(
        {
          error:
            "Analisis invalido",
        },
        {
          status: 400,
        }
      );
    }

    const informe =
      await prisma
        .vulnerabilidadInforme
        .findUnique({
          where: {
            id,
          },
          select: {
            id: true,
          },
        });

    if (!informe) {
      return Response.json(
        {
          error:
            "Analisis no encontrado",
        },
        {
          status: 404,
        }
      );
    }

    await prisma
      .vulnerabilidadInforme
      .delete({
        where: {
          id,
        },
      });

    return Response.json({
      ok: true,
    });
  } catch (error: any) {
    console.error(error);

    return Response.json(
      {
        error:
          error.message ||
          "Error eliminando analisis",
      },
      {
        status: 500,
      }
    );
  }
}
