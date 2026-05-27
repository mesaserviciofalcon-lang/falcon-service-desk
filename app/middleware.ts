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

    "/solicitudes/:path*",

    "/cambiar-password/:path*",
  ],
};