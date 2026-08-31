import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(request) {
    const token = request.nextauth.token;
    const pathname = request.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (token.debeCambiarPassword === true && !pathname.startsWith("/cambiar-password")) {
      return NextResponse.redirect(new URL("/cambiar-password", request.url));
    }

    const rol = String(token.role || "");
    if (pathname.startsWith("/usuarios") && rol !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (rol === "TECNICO" && (pathname.startsWith("/solicitudes") || pathname.startsWith("/antecedentes"))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (rol === "SUPERVISOR" && pathname.startsWith("/configuracion")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  },
  { pages: { signIn: "/login" } }
);

export const config = {

  matcher: [

    "/dashboard/:path*",

    "/tickets/:path*",

    "/solicitudes/:path*",

    "/antecedentes/:path*",

    "/visitas/:path*",

    "/usuarios/:path*",

    "/vulnerabilidades/:path*",

    "/equipo-administrativo/:path*",

    "/organigrama-seguridad/:path*",

    "/actividades-supervisores/:path*",

    "/solicitudes-accion/:path*",

    "/cambiar-password/:path*",
  ],
};
