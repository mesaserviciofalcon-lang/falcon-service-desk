import "./globals.css";

import AuthProvider
from "@/providers/SessionProvider";

import { Toaster }
from "react-hot-toast";

export const metadata = {
  title: "Mesa de Servicios Falcon",

  description: "Sistema de gestión de solicitudes",

  icons: {
    icon: "/favicon-v2.ico?v=2",
    shortcut: "/favicon-v2.ico?v=2",
  },
};

export default async function RootLayout({

  children,

}: {

  children: React.ReactNode;

}) {

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
