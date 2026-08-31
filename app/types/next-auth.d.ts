import NextAuth,
{
  DefaultSession
}
from "next-auth";

declare module "next-auth" {

  interface Session {

    user: {

      id?: string;

      role?: string;

      cargo?: string;

      fincaEAI?: string;

    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {

  interface JWT {

    role?: string;

    cargo?: string;

    id?: string;

    fincaEAI?: string;
  }
}
