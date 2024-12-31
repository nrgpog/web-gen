'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
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
    <div className="min-h-screen bg-gray-100 flex">
      {/* Barra lateral */}
      <div className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Herramientas</h2>
        <button
          onClick={() => router.push('/decoraciones')}
          className="w-full text-left px-4 py-2 rounded hover:bg-gray-700 transition-colors"
        >
          Decoraciones
        </button>
        <button
          onClick={() => router.push('/servidores')}
          className="w-full text-left px-4 py-2 rounded hover:bg-gray-700 transition-colors"
        >
          Servidores
        </button>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Tus servidores de Discord (Dueño)</h1>
            <button
              onClick={() => signOut()}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guilds.length === 0 ? (
              <div className="col-span-full text-center py-8 bg-white rounded-lg shadow-md">
                <p className="text-gray-600">No se encontraron servidores donde seas dueño</p>
              </div>
            ) : (
              guilds.map((guild) => (
                <div
                  key={guild.id}
                  onClick={() => handleGuildClick(guild.id)}
                  className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    {guild.icon ? (
                      <img
                        src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                        alt={guild.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-gray-500">
                          {guild.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <h2 className="font-semibold">{guild.name}</h2>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
