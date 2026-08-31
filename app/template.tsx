"use client";

import Header
from "../components/Header";

import Sidebar
from "../components/Sidebar";

import {

  usePathname,

} from "next/navigation";

import {

  useSession,

} from "next-auth/react";

export default function Template({

  children,

}: {

  children: React.ReactNode;

}) {

  const pathname =
    usePathname();

  const {
    data: session,
  } = useSession();

  // PAGINAS SIN LAYOUT

  const authPages = [

    "/login",

    "/forgot-password",

    "/reset-password",
  ];

  const isAuthPage =

    authPages.includes(
      pathname
    );

  if (isAuthPage) {

    return <>{children}</>;
  }

  return (

    <main className="flex bg-[#E8EEF2] min-h-screen">

      <Sidebar

        role={
          session?.user?.role || ""
        }

        cargo={
          session?.user?.cargo || ""
        }

      />

      <section className="flex-1">

        <Header />

        <div className="p-8">

          {children}

        </div>

      </section>

    </main>
  );
}
