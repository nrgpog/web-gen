'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
}

export default function ApolloAutomatizado() {
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
    router.push(`/apollo-automatizado/${guildId}`);
  };

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

  if (status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-8">
          Apollo Automatizado - Selecciona un Servidor
        </h1>

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
  );
} 