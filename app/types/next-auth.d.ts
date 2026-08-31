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

      debeCambiarPassword?: boolean;

      fincaEAI?: string;

    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {

  interface JWT {

    role?: string;

    cargo?: string;

    debeCambiarPassword?: boolean;

    id?: string;

    fincaEAI?: string;
  }
}
