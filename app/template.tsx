"use client";

import Header
from "../components/Header";

import Sidebar
from "../components/Sidebar";

import {

  usePathname,

} from "next/navigation";

export default function Template({

  children,

}: {

  children: React.ReactNode;

}) {

  const pathname =
    usePathname();

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

    <main className="flex bg-gray-100 min-h-screen">

      <Sidebar role="ADMIN" />

      <section className="flex-1">

        <Header />

        <div className="p-8">

          {children}

        </div>

      </section>

    </main>
  );
}