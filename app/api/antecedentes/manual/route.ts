import { getServerSession }
from "next-auth";

import { authOptions }
from "@/lib/auth";

import { prisma }
from "@/lib/prisma";

import {
  autorizacionAntecedenteOpciones,
  eaiOpciones,
  motivoAntecedenteManualOpciones,
  observacionAntecedenteOpciones,
  puedeVerAntecedenteCompleto,
  tipoDocumentoOpciones,
} from "@/lib/antecedentesCatalogos";

import { puedeVerTodasLasFincasEnConsultas }
from "@/lib/permisosConsultasSeguridad";

import {
  validarRegistroAntecedente,
} from "@/lib/validacionAntecedentesGestion";

import { obtenerFechaActualColombiaISO }
from "@/lib/fecha";

function texto(
  valor: unknown
) {
  return String(valor || "").trim();
}

function normalizarDocumento(
  valor: unknown
) {
  return texto(valor).replace(/\D/g, "");
}

function validarOpcion(
  valor: string,
  opciones: string[],
  campo: string,
  obligatorio = true
) {
  if (!valor && !obligatorio) {
    return null;
  }

  if (!valor) {
    return `Debe diligenciar ${campo}`;
  }

  if (!opciones.includes(valor)) {
    return `${campo} no tiene un valor valido`;
  }

  return null;
}

export async function GET(
  request: Request
) {
  const session =
    await getServerSession(
      authOptions
    );

  if (
    !puedeVerAntecedenteCompleto(
      session?.user?.role
    )
  ) {
    return Response.json(
      {
        error:
          "No tiene permiso para consultar antecedentes manuales",
      },
      {
        status: 403,
      }
    );
  }

  const usuario =
    session?.user?.email
      ? await prisma.usuario.findUnique({
          where: {
            email: session.user.email,
          },
          select: {
            fincaEAI: true,
          },
        })
      : null;
  const alcanceFinca =
    puedeVerTodasLasFincasEnConsultas(
      session?.user?.role
    )
      ? {}
      : {
          eai:
            usuario?.fincaEAI || "__SIN_FINCA__",
        };

  const url =
    new URL(request.url);

  const identificacion =
    normalizarDocumento(
      url.searchParams.get(
        "identificacion"
      )
    );

  if (identificacion.length < 5) {
    return Response.json({
      registro: null,
    });
  }

  const registro =
    await prisma.antecedenteRegistro.findFirst({
      where: {
        identificacion,
        ...alcanceFinca,
        fechaExpedicionDocumento: {
          not: null,
        },
      },
      select: {
        fechaExpedicionDocumento: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  return Response.json({
    registro,
  });
}

export async function POST(
  request: Request
) {
  const session =
    await getServerSession(
      authOptions
    );

  if (
    !puedeVerAntecedenteCompleto(
      session?.user?.role
    )
  ) {
    return Response.json(
      {
        error:
          "No tiene permiso para registrar antecedentes manuales",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const body =
      await request.json();

    const usuario =
      session?.user?.email
        ? await prisma.usuario.findUnique({
            where: {
              email: session.user.email,
            },
            select: {
              fincaEAI: true,
            },
          })
        : null;

    const fechaActual =
      obtenerFechaActualColombiaISO();

    const revisadoPorSesion =
      session?.user?.name ||
      session?.user?.email ||
      "Supervisor";

    const registro = {
      fechaSolicitud:
        texto(body.fechaSolicitud) ||
        fechaActual,
      fechaRespuesta:
        texto(body.fechaRespuesta) ||
        fechaActual,
      eai:
        texto(body.eai).toUpperCase(),
      nombresApellidos:
        texto(body.nombresApellidos)
          .toUpperCase(),
      tipoDocumento:
        texto(body.tipoDocumento)
          .toUpperCase(),
      identificacion:
        normalizarDocumento(
          body.identificacion
        ),
      fechaExpedicionDocumento:
        texto(
          body.fechaExpedicionDocumento
        ),
      observacion:
        texto(body.observacion),
      revisadoPor:
        revisadoPorSesion,
      motivo:
        texto(body.motivo),
      autorizacion:
        texto(body.autorizacion),
      observaciones:
        texto(body.observaciones),
    };

    if (
      !puedeVerTodasLasFincasEnConsultas(
        session?.user?.role
      ) &&
      registro.eai !== usuario?.fincaEAI
    ) {
      return Response.json(
        {
          error:
            "Solo puede registrar antecedentes para su propia finca",
        },
        {
          status: 403,
        }
      );
    }

    if (
      !registro.identificacion ||
      !/^\d+$/.test(
        registro.identificacion
      )
    ) {
      return Response.json(
        {
          error:
            "La identificacion debe contener solo numeros, sin puntos ni separadores",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !registro.nombresApellidos
    ) {
      return Response.json(
        {
          error:
            "Debe diligenciar nombres y apellidos",
        },
        {
          status: 400,
        }
      );
    }

    const erroresOpciones = [
      validarOpcion(
        registro.eai,
        eaiOpciones,
        "EAI"
      ),
      validarOpcion(
        registro.tipoDocumento,
        tipoDocumentoOpciones,
        "tipo de documento"
      ),
      validarOpcion(
        registro.observacion,
        observacionAntecedenteOpciones,
        "observacion"
      ),
      validarOpcion(
        registro.motivo,
        motivoAntecedenteManualOpciones,
        "motivo",
        false
      ),
      validarOpcion(
        registro.autorizacion,
        autorizacionAntecedenteOpciones,
        "autorizacion",
        false
      ),
    ].find(Boolean);

    if (erroresOpciones) {
      return Response.json(
        {
          error: erroresOpciones,
        },
        {
          status: 400,
        }
      );
    }

    const errorGestion =
      validarRegistroAntecedente(
        registro
      );

    if (errorGestion) {
      return Response.json(
        {
          error: errorGestion,
        },
        {
          status: 400,
        }
      );
    }

    const solicitud =
      await prisma.solicitud.create({
        data: {
          tipo: "ANTECEDENTES",
          solicitante:
            session?.user?.name ||
            "REGISTRO MANUAL",
          correoSolicitante:
            session?.user?.email,
          estado: "COMPLETADO",
          asignadoA: "SEGURIDAD",
          gestionadoPor:
            session?.user?.name ||
            "SISTEMA",
          fechaGestion: new Date(),
          fechaCierre: new Date(),
          antecedente: {
            create: {
              fincaEAI: "HISTORICO",
              observaciones:
                "Registro historico manual",
            },
          },
          antecedentesRegistros: {
            create: registro,
          },
        },
        select: {
          id: true,
          antecedentesRegistros: {
            select: {
              id: true,
              identificacion: true,
              observacion: true,
            },
          },
        },
      });

    return Response.json({
      solicitudId: solicitud.id,
      registro:
        solicitud.antecedentesRegistros[0],
    });

  } catch (error: any) {
    console.error(error);

    return Response.json(
      {
        error:
          error.message ||
          "Error registrando antecedente manual",
      },
      {
        status: 500,
      }
    );
  }
}
