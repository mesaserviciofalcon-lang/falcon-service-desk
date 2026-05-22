import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
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