// Fijate en el "export default" antes de function
export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-4">
          ¡Sistema ERP Vivo! 🚀
        </h1>
        <p className="text-gray-600 mb-6">
          Frontend conectado con Vite + React + TailwindCSS.
        </p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition duration-300">
          Iniciar Sesión
        </button>
      </div>
    </div>
  );
}