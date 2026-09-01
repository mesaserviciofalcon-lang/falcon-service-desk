import {

  withAuth,

} from "next-auth/middleware";

import {

  NextResponse,

} from "next/server";

export default withAuth(

  function middleware(req) {

    const token =
      req.nextauth.token;

    const pathname =
      req.nextUrl.pathname;

    // NO SESSION

    if (!token) {

      return NextResponse.redirect(
        new URL(
          "/login",
          req.url
        )
      );
    }

    const role =
      token.role as string;

    const debeCambiarPassword =
      token.debeCambiarPassword === true;

    if (
      debeCambiarPassword &&
      !pathname.startsWith(
        "/cambiar-password"
      )
    ) {
      return NextResponse.redirect(
        new URL(
          "/cambiar-password",
          req.url
        )
      );
    }

    if (

      pathname.includes(
        "/usuarios"
      )

      &&

      role !== "ADMIN"

    ) {

      return NextResponse.redirect(
        new URL(
          "/dashboard",
          req.url
        )
      );
    }

    // VISITA

    if (

      role === "VISITA"

      &&

      pathname.includes(
        "/admin"
      )

    ) {

      return NextResponse.redirect(
        new URL(
          "/dashboard",
          req.url
        )
      );
    }

    if (
      role === "TECNICO" &&
      (
        pathname.includes("/solicitudes") ||
        pathname.includes("/antecedentes")
      )
    ) {
      return NextResponse.redirect(
        new URL(
          "/dashboard",
          req.url
        )
      );
    }

    // SUPERVISOR

    if (

      role === "SUPERVISOR"

      &&

      pathname.includes(
        "/configuracion"
      )

    ) {

      return NextResponse.redirect(
        new URL(
          "/dashboard",
          req.url
        )
      );
    }

    return NextResponse.next();
  },

  {

    pages: {

      signIn:
        "/login",
    },
  }
);

export const config = {

  matcher: [

    "/dashboard/:path*",

    "/tickets/:path*",

    "/antecedentes/:path*",

    "/usuarios/:path*",

    "/solicitudes/:path*",

    "/vulnerabilidades/:path*",

    "/equipo-administrativo/:path*",

    "/organigrama-seguridad/:path*",

    "/actividades-supervisores/:path*",

    "/programacion-actividades/:path*",

    "/cambiar-password/:path*",
  ],
};
