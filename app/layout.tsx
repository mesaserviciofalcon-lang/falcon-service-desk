import "./globals.css";

import AuthProvider
from "@/providers/SessionProvider";

import { Toaster }
from "react-hot-toast";

import {
  headers,
} from "next/headers";

export const metadata = {
  title: "Mesa de Servicios Falcon",

  description: "Sistema de gestión de solicitudes",

  icons: {
    icon: "/favicon-v2.ico",
  },
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

  <Toaster
    position="top-center"
  />

</body>

    </html>
  );
}