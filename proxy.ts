export {
  default as proxy
}
from "next-auth/middleware";

export const config = {

  matcher: [

    "/dashboard/:path*",

    "/tickets/:path*",

    "/solicitudes/:path*",

    "/antecedentes/:path*",

    "/visitas/:path*",

    "/usuarios/:path*",

    "/cambiar-password/:path*",
  ],
};
