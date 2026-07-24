"use client";

import { useState, useEffect }
from "react";
import toast
from "react-hot-toast";

import { useRouter }
from "next/navigation";

import { useSession }
from "next-auth/react";

import UploadButton from "@/components/uploadthing/UploadButton";

import {
  encabezadosAntecedentesSolicitud,
  nombreHojaAntecedentes,
  nombrePlantillaAntecedentes,
}
from "@/lib/antecedentesPlantilla";

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
    fechaExpedicion,
    setFechaExpedicion
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
] = useState<any[]>([]);

const [
  guardando,
  setGuardando
] = useState(false);

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

  if (guardando) return;

  const tieneExcelAntecedentes =
    archivos.some(
      (archivo: any) =>
        archivo.tipo?.includes(
          "sheet"
        ) ||
        archivo.nombre?.match(
          /\.(xlsx|xls)$/i
        )
    );

  if (
    tipo === "ANTECEDENTES" &&
    !tieneExcelAntecedentes
  ) {
    toast.error(
      "Debe adjuntar un archivo Excel para antecedentes"
    );
    return;
  }

  setGuardando(true);

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

              nombreCandidato,

              cedula,

              fechaExpedicion,

              telefono,

              direccion,

              municipio,

              zona,

              cargo,

              motivoVisita,

              radio,

              serial,

              tipoFalla,

              archivos,
            }),
          }
        );

      if (!response.ok) {

        const errorData =
          await response.json();

        throw new Error(
          errorData.error ||
          "Error"
        );
      }

      const solicitud =
        await response.json();

 if (tipo === "ANTECEDENTES") {

  toast.success(

    "Solicitud creada correctamente. El estudio de antecedentes será analizado dentro de las próximas 24 horas.",

    {
      duration: 6000,
    }
  );

} else {

  toast.success(
    "Solicitud creada correctamente"
  );
}

setTimeout(() => {

  router.push(
    "/tickets"
  );

}, 1500);

} catch (error) {

  console.error(error);

  setGuardando(false);

  toast.error(
    error instanceof Error
      ? error.message
      : "Error al guardar solicitud"
  );
} }

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
              required
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
              required
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
              required
              value={cedula}
              onChange={(e) =>
                setCedula(
                  e.target.value
                )
              }
            />

            <div className="flex flex-col gap-1">

              <label className="text-sm text-gray-600">
                Fecha de expedición de la cédula
              </label>

              <input
                type="date"
                className="border p-3 rounded-lg"
                required
                value={fechaExpedicion}
                onChange={(e) =>
                  setFechaExpedicion(
                    e.target.value
                  )
                }
              />

            </div>

            <input
              type="text"
              placeholder="Teléfono"
              className="border p-3 rounded-lg"
              required
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
              required
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
              required
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
              required
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
              required
              value={cargo}
              onChange={(e) =>
                setCargo(
                  e.target.value
                )
              }
            />

            <select

  value={motivoVisita}

  onChange={(e) =>

    setMotivoVisita(
      e.target.value
    )
  }

  className="border p-3 rounded-lg"
>

  <option value="">

    Seleccione motivo

  </option>

  <option value="INGRESO">

    INGRESO

  </option>

  <option value="MANTENIMIENTO">

    MANTENIMIENTO

  </option>

</select>

          </div>
        )}

        {/* RADIOS */}

        {tipo === "RADIOS" && (

          <div className="flex flex-col gap-4">

            <input
              type="text"
              placeholder="Radio"
              className="border p-3 rounded-lg"
              required
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
              required
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
              required
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

          </div>
        )}

        {/* ANTECEDENTES */}

{tipo === "ANTECEDENTES" && (

  <div className="flex flex-col gap-4">

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

    <p className="text-sm text-gray-500">

      Adjunte Excel

    </p>

  </div>
)}

{/* NOVEDAD SEGURIDAD */}

{tipo === "NOVEDAD SEGURIDAD" && (

  <div className="flex flex-col gap-4">

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

{!tipo && (

  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">

    Seleccione primero el tipo de solicitud para habilitar la carga de archivos.

  </div>
)}

{tipo && (

<UploadButton

  allowedExtensions={
    tipo === "ANTECEDENTES"
      ? ["xlsx", "xls"]
      : undefined
  }

  requiredFileName={
    tipo === "ANTECEDENTES"
      ? nombrePlantillaAntecedentes
      : undefined
  }

  requiredSheetName={
    tipo === "ANTECEDENTES"
      ? nombreHojaAntecedentes
      : undefined
  }

  requiredHeaders={
    tipo === "ANTECEDENTES"
      ? encabezadosAntecedentesSolicitud
      : undefined
  }

  onComplete={(

    url: string,

    nombre: string,

    tipo: string

  ) => {

    setArchivos((prev) => [

      ...prev,

      {
        url,
        nombre,
        tipo,
      },
    ]);
  }}
/>
)}

{/* LISTA ARCHIVOS */}

{archivos.length > 0 && (

  <div className="mt-4">

    <h3 className="font-bold mb-2">

      Archivos cargados

    </h3>

    <div className="flex flex-col gap-2">

      {archivos.map(
        (
          archivo: any,
          index: number
        ) => (

          <div

            key={index}

            className="
              border
              rounded-lg
              p-3
              bg-gray-50
            "
          >

            <p className="font-medium">

              {archivo.nombre}

            </p>

          </div>
        )
      )}

    </div>

  </div>
)}

<button

  type="submit"

  disabled={guardando}

  className={`
    self-center
    text-white
    px-5
    py-2.5
    rounded-md
    text-sm
    font-semibold
    transition

    ${
      guardando

        ? "bg-gray-500 cursor-not-allowed"

        : "bg-black hover:bg-gray-800"
    }
  `}
>

  {
    guardando

      ? "Creando ticket..."

      : "Crear Solicitud"
  }

</button>

</form>

</div>

);
}
