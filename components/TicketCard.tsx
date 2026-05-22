import ReabrirTicket
from "@/components/ReabrirTicket";

import GestionTicket
from "@/components/GestionTicket";

export default function TicketCard({

  solicitud,

  role,

  session,

}: any) {

  return (

    <div
      className="bg-white p-5 rounded-xl shadow-md"
    >

      <div className="flex justify-between items-center">

        <h2 className="font-bold text-xl">
          {solicitud.tipo}
        </h2>

        <span className="text-sm text-gray-500">
          Ticket #
          {solicitud.id}
        </span>

      </div>

      <div className="mt-4 flex flex-col gap-2">

        <p>
          <strong>Solicitante:</strong>
          {" "}
          {solicitud.solicitante}
        </p>

        <p>
          <strong>Estado:</strong>
          {" "}
          {solicitud.estado}
        </p>

        <p>
          <strong>Asignado a:</strong>
          {" "}
          {solicitud.asignadoA}
        </p>

        <p>
          <strong>Fecha:</strong>
          {" "}
          {new Date(
  solicitud.fechaCreacion
).toISOString()}
        </p>

      </div>

      {/* CCTV */}

      {solicitud.tipo ===
        "CCTV" && (

        <div className="mt-4 border-t pt-4">

          <p>

            <strong>
              Finca:
            </strong>

            {" "}

            {
              solicitud.cctv
                ?.fincaEAI
            }

          </p>

          <p>

            <strong>
              Cámara:
            </strong>

            {" "}

            {
              solicitud.cctv
                ?.camaraAfectada
            }

          </p>

          <p>

            <strong>
              Falla:
            </strong>

            {" "}

            {
              solicitud.cctv
                ?.descripcionFalla
            }

          </p>

          <p>

            <strong>
              Prioridad:
            </strong>

            {" "}

            {
              solicitud.cctv
                ?.prioridad
            }

          </p>

        </div>
      )}

      {/* VISITA */}

      {solicitud.tipo ===
        "VISITA DOMICILIARIA" && (

        <div className="mt-4 border-t pt-4">

          <p>

            <strong>
              Candidato:
            </strong>

            {" "}

            {
              solicitud.visita
                ?.nombreCandidato
            }

          </p>

          <p>

            <strong>
              Cédula:
            </strong>

            {" "}

            {
              solicitud.visita
                ?.cedula
            }

          </p>

          <p>

            <strong>
              Teléfono:
            </strong>

            {" "}

            {
              solicitud.visita
                ?.telefono
            }

          </p>

          <p>

            <strong>
              Dirección:
            </strong>

            {" "}

            {
              solicitud.visita
                ?.direccion
            }

          </p>

          <p>

            <strong>
              Municipio:
            </strong>

            {" "}

            {
              solicitud.visita
                ?.municipio
            }

          </p>

          <p>

            <strong>
              Zona:
            </strong>

            {" "}

            {
              solicitud.visita
                ?.zona
            }

          </p>

          <p>

            <strong>
              Cargo:
            </strong>

            {" "}

            {
              solicitud.visita
                ?.cargo
            }

          </p>

          <p>

            <strong>
              Finca:
            </strong>

            {" "}

            {
              solicitud.visita
                ?.fincaEAI
            }

          </p>

          <p>

            <strong>
              Motivo:
            </strong>

            {" "}

            {
              solicitud.visita
                ?.motivoVisita
            }

          </p>

        </div>
      )}

      {/* RADIOS */}

      {solicitud.tipo ===
        "RADIOS" && (

        <div className="mt-4 border-t pt-4">

          <p>

            <strong>
              Radio:
            </strong>

            {" "}

            {
              solicitud.radio
                ?.radio
            }

          </p>

          <p>

            <strong>
              Serial:
            </strong>

            {" "}

            {
              solicitud.radio
                ?.serial
            }

          </p>

          <p>

            <strong>
              Tipo falla:
            </strong>

            {" "}

            {
              solicitud.radio
                ?.tipoFalla
            }

          </p>

          <p>

            <strong>
              Finca:
            </strong>

            {" "}

            {
              solicitud.radio
                ?.fincaEAI
            }

          </p>

        </div>
      )}

      {/* ANTECEDENTES */}

      {solicitud.tipo ===
        "ANTECEDENTES" && (

        <div className="mt-4 border-t pt-4">

          <p>

            <strong>
              Finca:
            </strong>

            {" "}

            {
              solicitud
                .antecedente
                ?.fincaEAI
            }

          </p>

          <p>

            <strong>
              Observaciones:
            </strong>

            {" "}

            {
              solicitud
                .antecedente
                ?.observaciones
            }

          </p>

        </div>
      )}

      {/* NOVEDAD */}

      {solicitud.tipo ===
        "NOVEDAD SEGURIDAD" && (

        <div className="mt-4 border-t pt-4">

          <p>

            <strong>
              Finca:
            </strong>

            {" "}

            {
              solicitud
                .novedad
                ?.fincaEAI
            }

          </p>

          <p>

            <strong>
              Contexto:
            </strong>

            {" "}

            {
              solicitud
                .novedad
                ?.contexto
            }

          </p>

        </div>
      )}

      {/* ARCHIVOS */}

      {solicitud.archivos &&
        solicitud.archivos.length > 0 && (

        <div className="mt-4 border-t pt-4">

          <h3 className="font-bold text-lg mb-3">
            Archivos Adjuntos
          </h3>

          <div className="flex flex-col gap-3">

            {solicitud.archivos.map(
              (archivo: any) => (

                <div
                  key={archivo.id}
                  className="border rounded-lg p-3"
                >

                  <p className="font-semibold">
                    {archivo.nombre}
                  </p>

                  {archivo.tipo.startsWith(
                    "image"
                  ) && (

                    <img

                      src={archivo.ruta}

                      alt={archivo.nombre}

                      className="mt-2 rounded-lg max-h-64 border"
                    />
                  )}

                  {archivo.tipo ===
                    "application/pdf" && (

                    <a

                      href={archivo.ruta}

                      target="_blank"

                      className="text-blue-600 underline"
                    >

                      Ver PDF

                    </a>
                  )}

                </div>
              )
            )}

          </div>

        </div>
      )}

      {/* REABRIR */}

      {role ===
        "SOLICITANTE"

        &&

        solicitud.estado ===
          "COMPLETADO" && (

        <ReabrirTicket

          ticketId={
            solicitud.id
          }

          usuario={
            session?.user?.name || ""
          }

        />
      )}

      {/* GESTION */}

      {(

        (
          role !==
          "SOLICITANTE"
        )

        ||

        (
          role ===
            "SOLICITANTE"

          &&

          solicitud.estado ===
            "REABIERTO"
        )

      ) && (

        <GestionTicket

          ticketId={
            solicitud.id
          }

          usuario={
            session?.user?.name || ""
          }

          role={
            role || ""
          }

          estadoActual={
            solicitud.estado
          }

        />
      )}

      {/* HISTORIAL */}

      {solicitud.gestiones
        ?.length > 0 && (

        <div className="mt-6 border-t pt-4">

          <h3 className="font-bold mb-3">
            Historial de gestión
          </h3>

          <div className="flex flex-col gap-3">

            {solicitud.gestiones.map(
              (gestion: any) => (

                <div
                  key={gestion.id}
                  className="bg-gray-100 p-3 rounded-lg"
                >

                  <p>

                    <strong>
                      Usuario:
                    </strong>

                    {" "}

                    {gestion.usuario}

                  </p>

                  <p>

                    <strong>
                      Estado:
                    </strong>

                    {" "}

                    {gestion.estado}

                  </p>

                  <p>

                    <strong>
                      Observación:
                    </strong>

                    {" "}

                    {gestion.observacion}

                  </p>

                </div>
              )
            )}

          </div>

        </div>
      )}

    </div>
  );
}