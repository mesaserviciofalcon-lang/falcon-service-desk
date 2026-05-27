import "./globals.css";

import AuthProvider
from "@/providers/SessionProvider";

import {
  headers,
} from "next/headers";

export const metadata = {

  title:
    "Mesa de Servicios",

  description:
    "Sistema de gestión de solicitudes",
};

export default async function RootLayout({

  children,

}: {

  children: React.ReactNode;

}) {

  const headersList =
    await headers();

  const pathname =

    headersList.get(
      "x-pathname"
    ) || "";

  const isLogin =

    pathname.includes(
      "/login"
    );

  return (

    <html lang="es">

      <body>

        <AuthProvider>

          <div>

            {children}

          </div>

        </AuthProvider>

      </body>

    </html>
  );
}