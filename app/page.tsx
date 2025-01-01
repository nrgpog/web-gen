'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  memberCount: number;
  status: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchGuilds = async () => {
      if (session?.accessToken) {
        try {
          const response = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
            cache: 'no-store'
          });

          const data = await response.json();

          if (data.message) {
            console.log('Respuesta de Discord:', data);
            return;
          }

          if (Array.isArray(data)) {
            const ownerGuilds = data.filter((guild: Guild) => guild.owner);
            setGuilds(ownerGuilds);
          }
        } catch (error) {
          console.error('Error al obtener los servidores:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (status !== 'loading') {
        setIsLoading(false);
      }
    };

    fetchGuilds();
  }, [session, status]);

  const handleGuildClick = (guildId: string) => {
    router.push(`/server/${guildId}`);
  };

  // Mostrar pantalla de carga mientras se verifica la sesión
  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Cargando...</div>
        </div>
      </div>
    );
  }

  // Mostrar pantalla de inicio de sesión
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8">Discord Server List</h1>
          <button
            onClick={() => signIn('discord')}
            className="bg-[#5865F2] text-white px-6 py-3 rounded-md hover:bg-[#4752C4] transition-colors"
          >
            Iniciar sesión con Discord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-white to-blue-900">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Barra lateral */}
        <div className="w-full lg:w-64 bg-black/20 backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-white/10 text-gray-900 p-6">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-blue-800 bg-clip-text text-transparent">
            Herramientas
          </h2>
          <div className="flex lg:flex-col gap-2">
            <button
              onClick={() => router.push('/decoraciones')}
              className="flex-1 lg:flex-none text-left px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-gray-900 font-medium flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
              <span>Decoraciones</span>
            </button>
            <button
              onClick={() => router.push('/servidores')}
              className="flex-1 lg:flex-none text-left px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-gray-900 font-medium flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              <span>Servidores</span>
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-blue-800 bg-clip-text text-transparent text-center sm:text-left">
                Tus servidores de Discord (Dueño)
              </h1>
              <button
                onClick={() => signOut()}
                className="w-full sm:w-auto px-6 py-2 rounded-lg bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-600/90 hover:to-red-700/90 transition-colors text-white backdrop-blur-xl shadow-lg shadow-red-500/20"
              >
                Cerrar sesión
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {guilds.length === 0 ? (
                <div className="col-span-full text-center py-8 bg-white/80 backdrop-blur-xl rounded-lg shadow-md border border-white/20">
                  <p className="text-gray-600">No se encontraron servidores donde seas dueño</p>
                </div>
              ) : (
                guilds.map((guild) => (
                  <div
                    key={guild.id}
                    onClick={() => handleGuildClick(guild.id)}
                    className="bg-white/80 backdrop-blur-xl p-4 rounded-lg shadow-md hover:shadow-lg transition-all hover:bg-white/90 cursor-pointer border border-white/20"
                  >
                    <div className="flex items-center space-x-4">
                      {guild.icon ? (
                        <img
                          src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                          alt={guild.name}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-900 via-gray-800 to-blue-800 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-white">
                            {guild.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <h2 className="font-semibold text-gray-900 flex-1 break-words">{guild.name}</h2>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
