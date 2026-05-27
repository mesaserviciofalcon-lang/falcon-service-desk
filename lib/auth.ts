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

          fincaEAI:
            usuario.fincaEAI,
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

        token.fincaEAI =
          (user as any).fincaEAI;
      }

      return token;
    },

    async session({
      session,
      token,
    }) {

      if (session.user) {

        session.user.role =
          token.role as string;

        session.user.fincaEAI =
          token.fincaEAI as string;
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