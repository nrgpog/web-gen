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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 flex items-center justify-center">
        <div className="text-center p-8 bg-black/30 backdrop-blur-xl rounded-xl border border-white/10">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-blue-500/20"></div>
            <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
          <div className="text-xl text-white/90 font-medium">Cargando<span className="animate-pulse">...</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          Decoraciones para Canales de Discord
        </h1>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {decoraciones.map((decoracion) => (
            <div 
              key={decoracion.id}
              className="bg-black/30 backdrop-blur-xl rounded-lg p-4 md:p-6 hover:bg-black/40 transition-all border border-white/10"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-white/90 mb-2">{decoracion.nombre}</h2>
                  <div className="relative group">
                    <p className="font-mono text-lg text-white/70 bg-black/20 rounded-lg p-3 break-all">
                      {decoracion.texto}
                    </p>
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity"></div>
                  </div>
                </div>
                <button
                  onClick={() => copiarAlPortapapeles(decoracion.texto)}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-all ${
                    copiado === decoracion.texto
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {copiado === decoracion.texto ? (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                        <span>Copiar</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}