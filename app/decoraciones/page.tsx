'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function DecoracionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [copiado, setCopiado] = useState('');

  // Lista de decoraciones
  const decoraciones = [
    {
      id: 1,
      nombre: "General",
      texto: "⟡﹒⿻﹒⌇⊹ general ꕤ﹒๑𖧡𓇢 ⌗"
    },
    {
      id: 2,
      nombre: "Anuncios",
      texto: "✧･ﾟ anuncios ･ﾟ✧"
    },
    {
      id: 3,
      nombre: "Chat",
      texto: "⋆｡°✩ chat ✩°｡⋆"
    },
    {
      id: 4,
      nombre: "Roles",
      texto: "⊹ ࣪ ˖ roles ˖ ࣪ ⊹"
    }
  ];

  // Función para copiar al portapapeles
  const copiarAlPortapapeles = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(texto);
      setTimeout(() => setCopiado(''), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  // Redirigir si no hay sesión
  if (status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  // Mostrar pantalla de carga mientras se verifica la sesión
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Decoraciones para Canales de Discord</h1>
        <div className="space-y-6">
          {decoraciones.map((decoracion) => (
            <div 
              key={decoracion.id}
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-all"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold mb-2">{decoracion.nombre}</h2>
                <button
                  onClick={() => copiarAlPortapapeles(decoracion.texto)}
                  className={`px-4 py-2 rounded ${
                    copiado === decoracion.texto
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } transition-colors`}
                >
                  {copiado === decoracion.texto ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="font-mono text-lg text-gray-300 mt-2">{decoracion.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 