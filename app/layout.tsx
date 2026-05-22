import "./globals.css";

import AuthProvider
from "@/providers/SessionProvider";

export const metadata = {

  title:
    "Mesa de Servicios",

  description:
    "Sistema de gestión de solicitudes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (

    <html lang="es">

      <body>

        <AuthProvider>

          {children}

        </AuthProvider>

      </body>

    </html>
  );
}