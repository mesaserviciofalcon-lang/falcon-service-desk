"use client";

import { useState, useEffect }
from "react";

import { useRouter }
from "next/navigation";

import { useSession }
from "next-auth/react";

export default function SolicitudesPage() {

  const router =
    useRouter();

  const { data: session } =
    useSession();

  const [tipo, setTipo] =
    useState("");

  const [
    solicitante,
    setSolicitante
  ] = useState("");

  const [
    correoSolicitante,
    setCorreoSolicitante
  ] = useState("");

  const [
    fincaEAI,
    setFincaEAI
  ] = useState("");

  const [
    descripcion,
    setDescripcion
  ] = useState("");

  const [
    camaraAfectada,
    setCamaraAfectada
  ] = useState("");

  // VISITA

  const [
    nombreCandidato,
    setNombreCandidato
  ] = useState("");

  const [
    cedula,
    setCedula
  ] = useState("");

  const [
    telefono,
    setTelefono
  ] = useState("");

  const [
    direccion,
    setDireccion
  ] = useState("");

  const [
    municipio,
    setMunicipio
  ] = useState("");

  const [
    zona,
    setZona
  ] = useState("");

  const [
    cargo,
    setCargo
  ] = useState("");

  const [
    motivoVisita,
    setMotivoVisita
  ] = useState("");

  const [
    prioridad,
    setPrioridad
  ] = useState("");

  const [
    serial,
    setSerial
  ] = useState("");

  // RADIOS

  const [
    radio,
    setRadio
  ] = useState("");

  const [
    tipoFalla,
    setTipoFalla
  ] = useState("");

  // ARCHIVOS

  const [
    archivos,
    setArchivos
  ] = useState<FileList | null>(
    null
  );

  // CARGAR DATOS SESION

  useEffect(() => {

    if (session?.user) {

      setSolicitante(
        session.user.name || ""
      );

      setCorreoSolicitante(
        session.user.email || ""
      );

      setFincaEAI(
        (session.user as any)
          .fincaEAI || ""
      );
    }

  }, [session]);

  async function crearSolicitud(
    e: React.FormEvent
  ) {

    e.preventDefault();

    try {

      const response =
        await fetch(
          "/api/solicitudes",
          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              tipo,

              solicitante,

              correoSolicitante,

              fincaEAI,

              descripcion,

              camaraAfectada,

              prioridad,

              nombreCandidato,

              cedula,

              telefono,

              direccion,

              municipio,

              zona,

              cargo,

              motivoVisita,

              radio,

              serial,

              tipoFalla,
            }),
          }
        );

      if (!response.ok) {

        throw new Error(
          "Error"
        );
      }

      const solicitud =
        await response.json();

      // SUBIR ARCHIVOS

      if (archivos) {

        for (
          let i = 0;
          i < archivos.length;
          i++
        ) {

          const formData =
            new FormData();

          formData.append(
            "file",
            archivos[i]
          );

          formData.append(
            "solicitudId",
            solicitud.id.toString()
          );

          await fetch(
            "/api/upload",
            {

              method: "POST",

              body: formData,
            }
          );
        }
      }

      alert(
        "Solicitud creada correctamente"
      );

      router.push(
        "/tickets"
      );

    } catch (error) {

      console.error(error);

      alert(
        "Error al guardar solicitud"
      );
    }
  }

  return (

    <div className="max-w-3xl">

      <h1 className="text-3xl font-bold mb-6">
        Crear Solicitud
      </h1>

      <form

        onSubmit={
          crearSolicitud
        }

        className="bg-white p-6 rounded-xl shadow-md flex flex-col gap-4"
      >

        {/* DATOS USUARIO */}

        <input
          type="text"
          value={solicitante}
          disabled
          className="border p-3 rounded-lg bg-gray-100"
        />

        <input
          type="email"
          value={correoSolicitante}
          disabled
          className="border p-3 rounded-lg bg-gray-100"
        />

        <input
          type="text"
          value={fincaEAI}
          disabled
          className="border p-3 rounded-lg bg-gray-100"
        />

        {/* TIPO */}

        <select

          value={tipo}

          onChange={(e) =>
            setTipo(
              e.target.value
            )
          }

          className="border p-3 rounded-lg"

          required
        >

          <option value="">
            Seleccione tipo
          </option>

          <option value="CCTV">
            SOPORTE CCTV
          </option>

          <option value="RADIOS">
            SOPORTE RADIOS
          </option>

          <option value="VISITA DOMICILIARIA">
            VISITA DOMICILIARIA
          </option>

          <option value="ANTECEDENTES">
  ESTUDIO DE ANTECEDENTES
</option>

<option value="NOVEDAD SEGURIDAD">
  NOVEDAD SEGURIDAD
</option>

        </select>

        {/* CCTV */}

        {tipo === "CCTV" && (

          <div className="flex flex-col gap-4">

            <input
              type="text"
              placeholder="Cámara afectada"
              className="border p-3 rounded-lg"
              value={camaraAfectada}
              onChange={(e) =>
                setCamaraAfectada(
                  e.target.value
                )
              }
            />

            <textarea
              placeholder="Descripción de la falla"
              className="border p-3 rounded-lg"
              value={descripcion}
              onChange={(e) =>
                setDescripcion(
                  e.target.value
                )
              }
            />

            <select
              className="border p-3 rounded-lg"
              value={prioridad}
              onChange={(e) =>
                setPrioridad(
                  e.target.value
                )
              }
            >

              <option value="">
                Seleccione prioridad
              </option>

              <option value="BAJA">
                Baja
              </option>

              <option value="MEDIA">
                Media
              </option>

              <option value="ALTA">
                Alta
              </option>

              <option value="CRITICA">
                Crítica
              </option>

            </select>

          </div>
        )}

        {/* VISITA */}

        {tipo ===
          "VISITA DOMICILIARIA" && (

          <div className="flex flex-col gap-4">

            <input
              type="text"
              placeholder="Nombre del candidato"
              className="border p-3 rounded-lg"
              value={nombreCandidato}
              onChange={(e) =>
                setNombreCandidato(
                  e.target.value
                )
              }
            />

            <input
              type="text"
              placeholder="Cédula"
              className="border p-3 rounded-lg"
              value={cedula}
              onChange={(e) =>
                setCedula(
                  e.target.value
                )
              }
            />

            <input
              type="text"
              placeholder="Teléfono"
              className="border p-3 rounded-lg"
              value={telefono}
              onChange={(e) =>
                setTelefono(
                  e.target.value
                )
              }
            />

            <input
              type="text"
              placeholder="Dirección"
              className="border p-3 rounded-lg"
              value={direccion}
              onChange={(e) =>
                setDireccion(
                  e.target.value
                )
              }
            />

            <input
              type="text"
              placeholder="Municipio"
              className="border p-3 rounded-lg"
              value={municipio}
              onChange={(e) =>
                setMunicipio(
                  e.target.value
                )
              }
            />

            <input
              type="text"
              placeholder="Zona"
              className="border p-3 rounded-lg"
              value={zona}
              onChange={(e) =>
                setZona(
                  e.target.value
                )
              }
            />

            <input
              type="text"
              placeholder="Cargo"
              className="border p-3 rounded-lg"
              value={cargo}
              onChange={(e) =>
                setCargo(
                  e.target.value
                )
              }
            />

            <textarea
              placeholder="Motivo de la visita"
              className="border p-3 rounded-lg"
              value={motivoVisita}
              onChange={(e) =>
                setMotivoVisita(
                  e.target.value
                )
              }
            />

          </div>
        )}

        {/* RADIOS */}

        {tipo === "RADIOS" && (

          <div className="flex flex-col gap-4">

            <input
              type="text"
              placeholder="Radio"
              className="border p-3 rounded-lg"
              value={radio}
              onChange={(e) =>
                setRadio(
                  e.target.value
                )
              }
            />

            <input
              type="text"
              placeholder="Serial"
              className="border p-3 rounded-lg"
              value={serial}
              onChange={(e) =>
                setSerial(
                  e.target.value
                )
              }
            />

            <input
              type="text"
              placeholder="Tipo de falla"
              className="border p-3 rounded-lg"
              value={tipoFalla}
              onChange={(e) =>
                setTipoFalla(
                  e.target.value
                )
              }
            />

            <textarea
              placeholder="Descripción"
              className="border p-3 rounded-lg"
              value={descripcion}
              onChange={(e) =>
                setDescripcion(
                  e.target.value
                )
              }
            />

            <select
              className="border p-3 rounded-lg"
              value={prioridad}
              onChange={(e) =>
                setPrioridad(
                  e.target.value
                )
              }
            >

              <option value="">
                Seleccione prioridad
              </option>

              <option value="BAJA">
                Baja
              </option>

              <option value="MEDIA">
                Media
              </option>

              <option value="ALTA">
                Alta
              </option>

              <option value="CRITICA">
                Crítica
              </option>

            </select>

          </div>
        )}

        {/* ANTECEDENTES */}

{tipo === "ANTECEDENTES" && (

  <div className="flex flex-col gap-4">

    <input
      type="text"
      placeholder="Finca EAI"
      className="border p-3 rounded-lg"
      value={fincaEAI}
      onChange={(e) =>
        setFincaEAI(
          e.target.value
        )
      }
    />

    <textarea
      placeholder="Observaciones"
      className="border p-3 rounded-lg"
      value={descripcion}
      onChange={(e) =>
        setDescripcion(
          e.target.value
        )
      }
    />

    <select
      className="border p-3 rounded-lg"
      value={prioridad}
      onChange={(e) =>
        setPrioridad(
          e.target.value
        )
      }
    >

      <option value="">
        Seleccione prioridad
      </option>

      <option value="BAJA">
        Baja
      </option>

      <option value="MEDIA">
        Media
      </option>

      <option value="ALTA">
        Alta
      </option>

      <option value="CRITICA">
        Crítica
      </option>

    </select>

    <p className="text-sm text-gray-500">

      Adjunte Excel

    </p>

  </div>
)}

{/* NOVEDAD SEGURIDAD */}

{tipo === "NOVEDAD SEGURIDAD" && (

  <div className="flex flex-col gap-4">

    <input
      type="text"
      placeholder="Finca EAI"
      className="border p-3 rounded-lg"
      value={fincaEAI}
      onChange={(e) =>
        setFincaEAI(
          e.target.value
        )
      }
    />

    <textarea
      placeholder="Contexto de la novedad o queja"
      className="border p-3 rounded-lg"
      value={descripcion}
      onChange={(e) =>
        setDescripcion(
          e.target.value
        )
      }
    />

  </div>
)}

        {/* ARCHIVOS */}

        <input

          type="file"

          multiple

          onChange={(e) =>
            setArchivos(
              e.target.files
            )
          }

          className="border p-3 rounded-lg"
        />

        <button

          type="submit"

          className="bg-black text-white p-3 rounded-lg hover:bg-gray-800"
        >

          Crear Solicitud

        </button>

      </form>

    </div>
  );
}