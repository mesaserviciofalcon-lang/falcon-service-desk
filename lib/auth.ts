import { NextAuthOptions }
from "next-auth";

import CredentialsProvider
from "next-auth/providers/credentials";

import bcrypt
from "bcryptjs";

import { prisma }
from "@/lib/prisma";

export const authOptions:
NextAuthOptions = {

  providers: [

    CredentialsProvider({

      name: "credentials",

      credentials: {

        email: {
          label: "Email",
          type: "email",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {

        if (
          !credentials?.email ||
          !credentials?.password
        ) {

          return null;
        }

        const usuario =
          await prisma.usuario.findUnique({

            where: {
              email:
                credentials.email,
            },
          });

        if (!usuario) {

          return null;
        }

        if (!usuario.activo) {

          return null;
        }

        const passwordValido =
          await bcrypt.compare(

            credentials.password,

            usuario.password
          );

        if (!passwordValido) {

          return null;
        }

        return {

          id:
            usuario.id.toString(),

          name:
            usuario.nombre,

          email:
            usuario.email,

          role:
            usuario.rol,

          cargo:
            usuario.cargo,

          fincaEAI:
            usuario.fincaEAI,

          debeCambiarPassword:
            usuario.debeCambiarPassword,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {

    async jwt({
      token,
      user,
    }) {

      if (user) {

        token.role =
          (user as any).role;

        token.cargo =
          (user as any).cargo;

        token.id =
          user.id;

        token.fincaEAI =
          (user as any).fincaEAI;

        token.debeCambiarPassword =
          (user as any).debeCambiarPassword;
      }

      return token;
    },

    async session({
      session,
      token,
    }) {

      if (session.user) {

        const usuarioActual = session.user.email
          ? await prisma.usuario.findUnique({
              where: { email: session.user.email },
              select: { nombre: true, rol: true, cargo: true, fincaEAI: true, debeCambiarPassword: true },
            })
          : null;

        session.user.role =
          usuarioActual?.rol || token.role as string;

        session.user.cargo =
          usuarioActual?.cargo || token.cargo as string;

        session.user.id =
          token.id as string;

        session.user.fincaEAI =
          usuarioActual?.fincaEAI || token.fincaEAI as string;

        session.user.debeCambiarPassword =
          usuarioActual?.debeCambiarPassword ?? token.debeCambiarPassword as boolean;
      }

      return session;
    },
  },
pages: {

  signIn: "/login",
},
  secret:
    process.env.NEXTAUTH_SECRET,
};
