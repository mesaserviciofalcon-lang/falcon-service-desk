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

      fincaEAI?: string;

    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {

  interface JWT {

    role?: string;

    id?: string;

    fincaEAI?: string;
  }
}
