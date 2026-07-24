"use client";

import { useRouter }
from "next/navigation";

import { useState }
from "react";

import toast
from "react-hot-toast";

const roles = [
  "ADMIN",
  "SOLICITANTE",
  "SUPERVISOR",
  "VISITA",
  "TECNICO",
  "JEFE_SEG",
  "DIRECTOR_SEG",
];

const fincas = [
  "",
  "AJ",
  "P0",
  "SZ",
  "AB",
  "LC",
  "FPK",
  "LN",
  "TM",
  "LV",
  "IB",
  "ADM",
  "I4",
];

type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  fincaEAI?: string | null;
  activo: boolean;
};

const usuarioVacio = {
  nombre: "",
  email: "",
  password: "",
  rol: "SOLICITANTE",
  fincaEAI: "",
  activo: true,
};

export default function GestionUsuarios({
  usuarios,
  usuarioActualId,
}: {
  usuarios: Usuario[];
  usuarioActualId?: string;
}) {
  const router =
    useRouter();

  const [nuevo, setNuevo] =
    useState(usuarioVacio);

  const [editandoId, setEditandoId] =
    useState<number | null>(null);

  const [formEdicion, setFormEdicion] =
    useState<any>({});

  const [guardando, setGuardando] =
    useState(false);

  function iniciarEdicion(
    usuario: Usuario
  ) {
    setEditandoId(usuario.id);
    setFormEdicion({
      ...usuario,
      password: "",
      fincaEAI:
        usuario.fincaEAI || "",
    });
  }

  async function crearUsuario() {
    try {
      setGuardando(true);

      const response =
        await fetch("/api/usuarios", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(nuevo),
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "No se pudo crear"
        );
      }

      toast.success(
        "Usuario creado correctamente"
      );

      setNuevo(usuarioVacio);
      router.refresh();

    } catch (error: any) {
      toast.error(
        error.message ||
        "Error creando usuario"
      );

    } finally {
      setGuardando(false);
    }
  }

  async function guardarUsuario() {
    if (!editandoId) return;

    try {
      setGuardando(true);

      const response =
        await fetch(
          `/api/usuarios/${editandoId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              formEdicion
            ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "No se pudo guardar"
        );
      }

      toast.success(
        "Usuario actualizado"
      );

      setEditandoId(null);
      router.refresh();

    } catch (error: any) {
      toast.error(
        error.message ||
        "Error actualizando usuario"
      );

    } finally {
      setGuardando(false);
    }
  }

  async function eliminarUsuario(
    usuario: Usuario
  ) {
    if (
      String(usuario.id) ===
      usuarioActualId
    ) {
      toast.error(
        "No puede eliminar su propio usuario"
      );
      return;
    }

    const confirmar =
      window.confirm(
        `¿Seguro que desea eliminar a ${usuario.nombre}? Esta accion no se puede deshacer.`
      );

    if (!confirmar) return;

    try {
      const response =
        await fetch(
          `/api/usuarios/${usuario.id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "No se pudo eliminar"
        );
      }

      toast.success(
        "Usuario eliminado"
      );

      router.refresh();

    } catch (error: any) {
      toast.error(
        error.message ||
        "Error eliminando usuario"
      );
    }
  }

  async function cambiarEstado(
    usuario: Usuario
  ) {
    setEditandoId(usuario.id);
    setFormEdicion({
      ...usuario,
      password: "",
      activo: !usuario.activo,
      fincaEAI:
        usuario.fincaEAI || "",
    });

    const response =
      await fetch(
        `/api/usuarios/${usuario.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ...usuario,
            activo: !usuario.activo,
            fincaEAI:
              usuario.fincaEAI || "",
          }),
        }
      );

    if (response.ok) {
      toast.success(
        usuario.activo
          ? "Usuario desactivado"
          : "Usuario activado"
      );
      setEditandoId(null);
      router.refresh();
      return;
    }

    const data =
      await response.json();

    toast.error(
      data.error ||
      "No se pudo cambiar el estado"
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
        <h2 className="mb-4 text-xl font-bold">
          Crear usuario
        </h2>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={nuevo.nombre}
            onChange={(event) =>
              setNuevo({
                ...nuevo,
                nombre:
                  event.target.value,
              })
            }
            placeholder="Nombre"
            className="rounded-lg border p-3"
          />

          <input
            value={nuevo.email}
            onChange={(event) =>
              setNuevo({
                ...nuevo,
                email:
                  event.target.value,
              })
            }
            placeholder="Correo"
            className="rounded-lg border p-3"
          />

          <input
            type="password"
            value={nuevo.password}
            onChange={(event) =>
              setNuevo({
                ...nuevo,
                password:
                  event.target.value,
              })
            }
            placeholder="Contraseña"
            className="rounded-lg border p-3"
          />

          <select
            value={nuevo.rol}
            onChange={(event) =>
              setNuevo({
                ...nuevo,
                rol: event.target.value,
              })
            }
            className="rounded-lg border p-3"
          >
            {roles.map((rol) => (
              <option
                key={rol}
                value={rol}
              >
                {rol}
              </option>
            ))}
          </select>

          <select
            value={nuevo.fincaEAI}
            onChange={(event) =>
              setNuevo({
                ...nuevo,
                fincaEAI:
                  event.target.value,
              })
            }
            className="rounded-lg border p-3"
          >
            {fincas.map((finca) => (
              <option
                key={finca || "sin-finca"}
                value={finca}
              >
                {finca || "Sin finca"}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={crearUsuario}
            disabled={guardando}
            className="rounded-lg bg-black p-3 text-white hover:bg-gray-800 disabled:bg-gray-400"
          >
            Crear usuario
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
        <h2 className="mb-4 text-xl font-bold">
          Usuarios
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">
                  Nombre
                </th>
                <th className="border p-2 text-left">
                  Correo
                </th>
                <th className="border p-2 text-left">
                  Rol
                </th>
                <th className="border p-2 text-left">
                  Finca
                </th>
                <th className="border p-2 text-left">
                  Estado
                </th>
                <th className="border p-2 text-left">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {usuarios.map((usuario) => {
                const editando =
                  editandoId === usuario.id;

                return (
                  <tr key={usuario.id}>
                    <td className="border p-2">
                      {editando ? (
                        <input
                          value={
                            formEdicion.nombre
                          }
                          onChange={(event) =>
                            setFormEdicion({
                              ...formEdicion,
                              nombre:
                                event.target.value,
                            })
                          }
                          className="rounded border p-2"
                        />
                      ) : (
                        usuario.nombre
                      )}
                    </td>
                    <td className="border p-2">
                      {editando ? (
                        <input
                          value={
                            formEdicion.email
                          }
                          onChange={(event) =>
                            setFormEdicion({
                              ...formEdicion,
                              email:
                                event.target.value,
                            })
                          }
                          className="rounded border p-2"
                        />
                      ) : (
                        usuario.email
                      )}
                    </td>
                    <td className="border p-2">
                      {editando ? (
                        <select
                          value={
                            formEdicion.rol
                          }
                          onChange={(event) =>
                            setFormEdicion({
                              ...formEdicion,
                              rol:
                                event.target.value,
                            })
                          }
                          className="rounded border p-2"
                        >
                          {roles.map((rol) => (
                            <option
                              key={rol}
                              value={rol}
                            >
                              {rol}
                            </option>
                          ))}
                        </select>
                      ) : (
                        usuario.rol
                      )}
                    </td>
                    <td className="border p-2">
                      {editando ? (
                        <select
                          value={
                            formEdicion.fincaEAI
                          }
                          onChange={(event) =>
                            setFormEdicion({
                              ...formEdicion,
                              fincaEAI:
                                event.target.value,
                            })
                          }
                          className="rounded border p-2"
                        >
                          {fincas.map((finca) => (
                            <option
                              key={
                                finca ||
                                "sin-finca-edicion"
                              }
                              value={finca}
                            >
                              {finca ||
                                "Sin finca"}
                            </option>
                          ))}
                        </select>
                      ) : (
                        usuario.fincaEAI ||
                        "Sin finca"
                      )}
                    </td>
                    <td className="border p-2">
                      <span
                        className={
                          usuario.activo
                            ? "text-green-700"
                            : "text-red-700"
                        }
                      >
                        {usuario.activo
                          ? "Activo"
                          : "Inactivo"}
                      </span>
                    </td>
                    <td className="border p-2">
                      <div className="flex flex-wrap gap-2">
                        {editando ? (
                          <>
                            <input
                              type="password"
                              value={
                                formEdicion.password
                              }
                              onChange={(event) =>
                                setFormEdicion({
                                  ...formEdicion,
                                  password:
                                    event
                                      .target
                                      .value,
                                })
                              }
                              placeholder="Nueva contraseña"
                              className="rounded border p-2"
                            />
                            <button
                              type="button"
                              onClick={
                                guardarUsuario
                              }
                              className="rounded bg-blue-600 px-3 py-2 text-white"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setEditandoId(
                                  null
                                )
                              }
                              className="rounded bg-gray-200 px-3 py-2"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                iniciarEdicion(
                                  usuario
                                )
                              }
                              className="rounded bg-blue-600 px-3 py-2 text-white"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                cambiarEstado(
                                  usuario
                                )
                              }
                              className="rounded bg-yellow-500 px-3 py-2 text-white"
                            >
                              {usuario.activo
                                ? "Desactivar"
                                : "Activar"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                eliminarUsuario(
                                  usuario
                                )
                              }
                              className="rounded bg-red-600 px-3 py-2 text-white"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
