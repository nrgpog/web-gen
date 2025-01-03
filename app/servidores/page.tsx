'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ServerInfo {
  name: string;
  description: string | null;
  memberCount: number;
  inviteCode: string;
  iconUrl: string | null;
  userIsMember: boolean;
}

// Función de utilidad para esperar
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Función para hacer peticiones con reintento
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  let lastError;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        // Obtener el tiempo de espera del header de Discord o usar un valor predeterminado
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
        console.log(`Rate limited. Esperando ${retryAfter} segundos...`);
        await wait(retryAfter * 1000);
        retryCount++;
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error;
      retryCount++;
      if (retryCount < maxRetries) {
        // Espera exponencial: 1s, 2s, 4s, etc.
        const waitTime = Math.pow(2, retryCount - 1) * 1000;
        console.log(`Reintento ${retryCount}/${maxRetries} después de ${waitTime}ms`);
        await wait(waitTime);
      }
    }
  }
  
  throw lastError || new Error('Máximo de reintentos alcanzado');
}

export default function ServidoresPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [servidores, setServidores] = useState<ServerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServerInfo = async () => {
      if (!session?.accessToken) return;

      try {
        // Lista de invitaciones a verificar
        const inviteCodes = ['aeolouscm'];
        console.log('Iniciando búsqueda de servidores para invitaciones:', inviteCodes);

        // Primero, obtener la lista de servidores del usuario una sola vez
        console.log('Obteniendo lista de servidores del usuario...');
        const userGuildsResponse = await fetchWithRetry(
          'https://discord.com/api/v10/users/@me/guilds',
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        if (!userGuildsResponse.ok) {
          console.error('Error al obtener servidores del usuario:', userGuildsResponse.status);
          throw new Error('Error al obtener los servidores del usuario');
        }

        const userGuilds = await userGuildsResponse.json();
        console.log('Lista de servidores del usuario obtenida');

        // Luego, procesar cada invitación
        const serversInfo = await Promise.allSettled(
          inviteCodes.map(async (code) => {
            console.log(`Procesando invitación: ${code}`);
            try {
              // Obtener información del servidor usando la API de Discord
              console.log(`Obteniendo información para ${code}...`);
              const inviteResponse = await fetchWithRetry(
                `https://discord.com/api/v10/invites/${code}?with_counts=true`,
                {
                  headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                  },
                }
              );

              if (!inviteResponse.ok) {
                console.error(`Error en invitación ${code}:`, inviteResponse.status, inviteResponse.statusText);
                throw new Error(`Error al obtener información del servidor: ${inviteResponse.statusText}`);
              }

              const inviteData = await inviteResponse.json();
              console.log(`Datos obtenidos para ${code}:`, inviteData.guild.name);

              // Verificar si el usuario es miembro usando la lista obtenida anteriormente
              const userIsMember = userGuilds.some((guild: any) => guild.id === inviteData.guild.id);
              console.log(`Estado de membresía para ${code}:`, userIsMember);

              return {
                name: inviteData.guild.name,
                description: inviteData.guild.description,
                memberCount: inviteData.approximate_member_count,
                inviteCode: code,
                iconUrl: inviteData.guild.icon 
                  ? `https://cdn.discordapp.com/icons/${inviteData.guild.id}/${inviteData.guild.icon}.png`
                  : null,
                userIsMember,
              };
            } catch (error) {
              console.error(`Error al procesar el servidor ${code}:`, error);
              return null;
            }
          })
        );

        console.log('Resultados de las promesas:', serversInfo);

        // Filtrar y procesar los resultados
        const validServers = serversInfo
          .filter((result): result is PromiseFulfilledResult<ServerInfo | null> => 
            result.status === 'fulfilled' && result.value !== null
          )
          .map(result => result.value as ServerInfo);

        console.log('Servidores válidos encontrados:', validServers.length);
        setServidores(validServers);
      } catch (error) {
        console.error('Error al obtener información de los servidores:', error);
        setError('Error al cargar la información de los servidores');
      } finally {
        setLoading(false);
      }
    };

    if (session?.accessToken) {
      fetchServerInfo();
    }
  }, [session]);

  // Redirigir si no hay sesión
  if (status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  // Mostrar pantalla de carga
  if (status === 'loading' || loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Servidores de Discord</h1>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {servidores.map((servidor) => (
            <div 
              key={servidor.inviteCode}
              className="bg-black/30 backdrop-blur-xl rounded-lg p-4 md:p-6 hover:bg-black/40 transition-all border border-white/10"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {servidor.iconUrl ? (
                  <img 
                    src={servidor.iconUrl} 
                    alt={servidor.name} 
                    className="w-16 h-16 rounded-full ring-2 ring-white/10"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center ring-2 ring-white/10">
                    <span className="text-2xl font-bold text-white">
                      {servidor.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <h2 className="text-xl font-semibold text-white/90 truncate">{servidor.name}</h2>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm w-fit ${
                      servidor.userIsMember ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {servidor.userIsMember ? 'Miembro' : 'No unido'}
                    </span>
                  </div>
                  {servidor.description && (
                    <p className="text-white/70 mt-2 line-clamp-2">{servidor.description}</p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3">
                    <span className="text-white/60 truncate">
                      {servidor.memberCount.toLocaleString()} miembros
                    </span>
                    <a
                      href={`https://discord.gg/${servidor.inviteCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 truncate"
                    >
                      discord.gg/{servidor.inviteCode}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}