import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { enviarCorreo }
from "@/lib/email";

import { prisma }
from "@/lib/prisma";

import {
  formatearReferenciaVulnerabilidad,
  generarConsecutivoVulnerabilidad,
  obtenerContactosVulnerabilidad,
  obtenerCopiasVulnerabilidad,
  vulnerabilidadCorreoTemplate,
} from "@/lib/vulnerabilidades";

import { generarPdfVulnerabilidad }
from "@/lib/vulnerabilidadesPdf";

const rolesPermitidos = [
  "ADMIN",
  "DIRECTOR_SEG",
  "JEFE_SEG",
  "SUPERVISOR",
];

function texto(
  valor: unknown
) {
  return String(valor || "")
    .trim();
}

function fechaFormulario(
  valor: unknown
) {
  const textoFecha =
    texto(valor);

  if (!textoFecha) {
    return new Date();
  }

  const partesHora =
    new Intl.DateTimeFormat(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone:
          "America/Bogota",
      }
    ).formatToParts(new Date());
  const obtenerParte = (
    tipo: string
  ) =>
    partesHora.find(
      (parte) =>
        parte.type === tipo
    )?.value || "00";
  const hora =
    obtenerParte("hour");
  const minuto =
    obtenerParte("minute");
  const segundo =
    obtenerParte("second");

  return new Date(
    `${textoFecha}T${hora}:${minuto}:${segundo}-05:00`
  );
}

export async function POST(
  request: Request
) {
  const session =
    await getServerSession(
      authOptions
    );

  if (
    !rolesPermitidos.includes(
      session?.user?.role || ""
    )
  ) {
    return Response.json(
      {
        error:
          "No tiene permiso para crear informes de vulnerabilidad",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const usuarioSesion =
      session!.user;

    const body =
      await request.json();

    const eai =
      texto(body.eai);
    const actoInseguro =
      texto(body.actoInseguro);
    const vulnerabilidad =
      texto(body.vulnerabilidad);
    const planAccionSugerido =
      texto(body.planAccionSugerido);
    const fotos =
      Array.isArray(body.fotos)
        ? body.fotos
        : [];
    const reportadoPor =
      texto(body.reportadoPor);

    if (
      !eai ||
      !actoInseguro ||
      !vulnerabilidad ||
      !planAccionSugerido ||
      !reportadoPor
    ) {
      return Response.json(
        {
          error:
            "Debe diligenciar finca, acto inseguro, vulnerabilidad, plan de accion sugerido y persona que realizo el reporte",
        },
        {
          status: 400,
        }
      );
    }

    if (fotos.length === 0) {
      return Response.json(
        {
          error:
            "Debe adjuntar al menos una imagen de la novedad para generar el informe",
        },
        {
          status: 400,
        }
      );
    }

    const contactos =
      obtenerContactosVulnerabilidad(eai);

    if (!contactos.analista?.correo) {
      return Response.json(
        {
          error:
            "No hay ANALISTA SIG configurado para esta finca. Revise la base de correos de vulnerabilidades.",
        },
        {
          status: 400,
        }
      );
    }

    const copiasBase =
      [
        contactos.gerente?.correo,
        ...obtenerCopiasVulnerabilidad(),
      ].filter(Boolean) as string[];

    const destinatarios =
      Array.from(
        new Set([
          contactos.analista.correo,
        ])
      );

    const copias =
      Array.from(
        new Set(copiasBase)
      );

    if (destinatarios.length === 0) {
      return Response.json(
        {
          error:
            "No hay destinatarios configurados para esta finca.",
        },
        {
          status: 400,
        }
      );
    }

    const fechaReporte =
      fechaFormulario(body.fecha);
    const consecutivo =
      await generarConsecutivoVulnerabilidad({
        prisma,
        eai,
        fecha:
          fechaReporte,
      });

    const informe =
      await prisma
        .vulnerabilidadInforme
        .create({
          data: {
            consecutivo,
            eai,
            fecha:
              fechaReporte,
            actoInseguro,
            vulnerabilidad,
            planAccionSugerido,
            causaRaiz:
              null,
            proceso:
              null,
            planAccionEai:
              null,
            responsables:
              null,
            fechaEjecucion:
              null,
            estado:
              texto(body.estado) ||
              "ABIERTO",
            supervisor:
              usuarioSesion.name ||
              "Supervisor",
            correoSupervisor:
              usuarioSesion.email ||
              null,
            reportadoPor,
            analistaSigNombre:
              contactos.analista?.nombre ||
              null,
            analistaSigCorreo:
              contactos.analista?.correo ||
              null,
            gerenteNombre:
              contactos.gerente?.nombre ||
              null,
            gerenteCorreo:
              contactos.gerente?.correo ||
              null,
            copiaCorreos:
              copias.join(",") ||
              null,
            destinatarios:
              destinatarios.join(","),
            fotos,
          },
        });

    const pdf =
      await generarPdfVulnerabilidad({
        id: informe.id,
        consecutivo:
          informe.consecutivo,
        eai: informe.eai,
        fecha: informe.fecha,
        actoInseguro:
          informe.actoInseguro,
        vulnerabilidad:
          informe.vulnerabilidad,
        planAccionSugerido:
          informe.planAccionSugerido,
        causaRaiz:
          informe.causaRaiz,
        proceso:
          informe.proceso,
        planAccionEai:
          informe.planAccionEai,
        responsables:
          informe.responsables,
        fechaEjecucion:
          informe.fechaEjecucion,
        estado:
          informe.estado,
        supervisor:
          informe.supervisor,
        reportadoPor:
          informe.reportadoPor,
        analistaSigNombre:
          informe.analistaSigNombre,
        gerenteNombre:
          informe.gerenteNombre,
        fotos,
      });

    await enviarCorreo({
      to:
        destinatarios.join(","),
      cc:
        copias.join(","),
      subject:
        `Analisis de vulnerabilidad ${formatearReferenciaVulnerabilidad({
          consecutivo:
            informe.consecutivo,
          eai:
            informe.eai,
          fecha:
            informe.fecha,
          id:
            informe.id,
        })}`,
      html:
        vulnerabilidadCorreoTemplate({
          id: informe.id,
          referencia:
            formatearReferenciaVulnerabilidad({
              consecutivo:
                informe.consecutivo,
              eai:
                informe.eai,
              fecha:
                informe.fecha,
              id:
                informe.id,
            }),
          eai: informe.eai,
          actoInseguro:
            informe.actoInseguro,
          reportadoPor:
            informe.reportadoPor ||
            informe.supervisor,
        }),
      attachments: [
        {
          filename:
            `vulnerabilidad-${informe.eai}-${informe.id}.pdf`,
          content:
            pdf,
          contentType:
            "application/pdf",
        },
      ],
    });

    return Response.json({
      ok: true,
      informeId:
        informe.id,
      enviadosA:
        destinatarios,
      copias,
    });
  } catch (error: any) {
    console.error(error);

    return Response.json(
      {
        error:
          error.message ||
          "Error creando informe de vulnerabilidad",
      },
      {
        status: 500,
      }
    );
  }
}
