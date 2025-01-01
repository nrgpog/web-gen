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

  // Mostrar pantalla de inicio de sesión
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full p-8 bg-black/30 backdrop-blur-xl rounded-xl border border-white/10">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            Lmao V4 Gen
          </h1>
          <p className="text-white/70 mb-8">
            Gestiona tus servidores de Discord de forma fácil y eficiente
          </p>
          <button
            onClick={() => signIn('discord')}
            className="w-full px-6 py-3 rounded-lg bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/30 transition-all group"
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-6 h-6 text-[#5865F2] group-hover:text-[#5865F2]/90" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span className="text-[#5865F2] group-hover:text-[#5865F2]/90 font-medium">
                Iniciar sesión con Discord
              </span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Barra lateral */}
        <div className="w-full lg:w-64 bg-black/40 backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-white/10 p-6">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            Lmao V4 Gen
          </h2>
          <div className="flex lg:flex-col gap-2">
            <button
              onClick={() => router.push('/decoraciones')}
              className="flex-1 lg:flex-none text-left px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-white/90 hover:text-white font-medium flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
              <span>Decoraciones</span>
            </button>
            <button
              onClick={() => router.push('/servidores')}
              className="flex-1 lg:flex-none text-left px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-white/90 hover:text-white font-medium flex items-center space-x-2"
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
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent text-center sm:text-left">
                Tus servidores de Discord (Dueño)
              </h1>
              <button
                onClick={() => signOut()}
                className="w-full sm:w-auto px-6 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/20 transition-colors text-red-400 hover:text-red-300"
              >
                Cerrar sesión
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {guilds.length === 0 ? (
                <div className="col-span-full text-center py-8 bg-black/30 backdrop-blur-xl rounded-lg border border-white/10">
                  <p className="text-white/70">No se encontraron servidores donde seas dueño</p>
                </div>
              ) : (
                guilds.map((guild) => (
                  <div
                    key={guild.id}
                    onClick={() => handleGuildClick(guild.id)}
                    className="bg-black/30 backdrop-blur-xl p-4 rounded-lg hover:bg-black/40 transition-all cursor-pointer border border-white/10 group"
                  >
                    <div className="flex items-center space-x-4">
                      {guild.icon ? (
                        <img
                          src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                          alt={guild.name}
                          className="w-12 h-12 rounded-full ring-2 ring-white/10"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center ring-2 ring-white/10">
                          <span className="text-xl font-bold text-white">
                            {guild.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <h2 className="font-semibold text-white/90 group-hover:text-white flex-1 break-words transition-colors">
                        {guild.name}
                      </h2>
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
