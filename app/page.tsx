import Header from "./components/Header";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <Header />

      <section className="p-10">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-3xl font-bold">
            Bienvenido
          </h2>

          <p className="mt-4 text-gray-600">
            Sistema de gestión de solicitudes y soporte.
          </p>
        </div>
      </section>
    </main>
  );
}