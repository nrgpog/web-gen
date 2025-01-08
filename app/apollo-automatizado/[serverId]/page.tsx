'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Question {
  question: string;
  answer: string;
}

interface ServerConfig {
  serverid: string;
  sorteo_duracion: string;
  sorteo_tiempo_respuesta: string;
  sorteo_tiempo_espera: string;
  sorteo_ganadores: number;
  sorteo_datos_por_ganador: number;
  isrunning: boolean;
  lastrun: string | null;
  categoryid: string | null;
  emoji_celebracion: string | null;
  emoji_trofeo: string | null;
  emoji_reloj: string | null;
  emoji_error: string | null;
  emoji_info: string | null;
  emoji_fin: string | null;
  preguntas: Question[];
  pending_data: string | null;
  pending_category: string | null;
  execution_requested_at: string | null;
  dataFile?: string;
}

export default function ApolloServerConfig() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<'sorteos' | 'emojis' | 'preguntas' | 'deploys'>('sorteos');
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchServerConfig = async () => {
      if (session?.accessToken && params.serverId) {
        try {
          const response = await fetch(`/api/apollo-config/${params.serverId}`);
          if (response.ok) {
            const data = await response.json();
            
            // Solo actualizar si hay cambios relevantes
            setServerConfig(prevConfig => {
              if (!prevConfig) return data;
              
              // Crear configuración actualizada manteniendo valores importantes
              const updatedConfig = {
                ...prevConfig, // Mantener todos los valores actuales
                // Solo actualizar estados de ejecución
                isrunning: data.isrunning,
                is_executing: data.is_executing,
                pending_data: data.pending_data,
                pending_category: data.pending_category,
                execution_requested_at: data.execution_requested_at
              };

              // Solo mostrar logs si hay cambios en el estado del sorteo
              if (
                prevConfig.isrunning !== data.isrunning ||
                prevConfig.pending_data !== data.pending_data ||
                prevConfig.pending_category !== data.pending_category ||
                prevConfig.execution_requested_at !== data.execution_requested_at
              ) {
                console.log('📊 Estado del sorteo actualizado:', {
                  isrunning: data.isrunning,
                  pending_data: data.pending_data ? 'Tiene datos' : 'No tiene datos',
                  pending_category: data.pending_category,
                  execution_requested_at: data.execution_requested_at
                });
              }
              
              return updatedConfig;
            });
          }
        } catch (error) {
          console.error('❌ Error al obtener la configuración:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (status !== 'loading') {
        setIsLoading(false);
      }
    };

    fetchServerConfig();
    const interval = setInterval(fetchServerConfig, 2000);
    return () => clearInterval(interval);
  }, [session, status, params.serverId]);

  const handleExecute = async () => {
    if (!serverConfig || isExecuting || !params.serverId) return;

    if (!serverConfig.dataFile) {
      toast.error("Por favor, carga un archivo de datos");
      return;
    }

    if (!serverConfig.categoryid) {
      toast.error("Por favor, ingresa el ID de la categoría");
      return;
    }

    // Verificar si ya hay un sorteo activo antes de intentar ejecutar
    if (serverConfig.isrunning && serverConfig.pending_data) {
      toast.error("Ya hay un sorteo activo en este servidor. Por favor, detén el sorteo actual antes de iniciar uno nuevo.");
      setActiveTab('deploys'); // Cambiar a la pestaña de deploys para mostrar el sorteo activo
      return;
    }

    try {
      setIsExecuting(true);
      const response = await fetch("/api/apollo-execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serverId: params.serverId,
          categoryId: serverConfig.categoryid,
          dataFile: serverConfig.dataFile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'Ya hay un sorteo activo en este servidor') {
          toast.error("Ya hay un sorteo activo. Por favor, detén el sorteo actual antes de iniciar uno nuevo.");
          setActiveTab('deploys');
        } else {
          throw new Error(data.error || "Error al ejecutar Apollo");
        }
        return;
      }

      toast.success("Sorteo iniciado exitosamente");
      setActiveTab('deploys');
      
      // Forzar actualización inmediata
      const configResponse = await fetch(`/api/apollo-config/${params.serverId}`);
      if (configResponse.ok) {
        const updatedConfig = await configResponse.json();
        setServerConfig(prevConfig => ({
          ...prevConfig,
          ...updatedConfig,
          dataFile: prevConfig?.dataFile // Mantener el archivo de datos
        }));
      }
    } catch (error) {
      console.error("❌ Error al ejecutar:", error);
      toast.error("Error al ejecutar Apollo");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!serverConfig || !params.serverId) return;

    try {
      const response = await fetch(`/api/apollo-config/${params.serverId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serverConfig),
      });

      if (response.ok) {
        const updatedConfig = await response.json();
        setServerConfig(updatedConfig);
      }
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
    }
  };

  const handleStopDeploy = async () => {
    if (!serverConfig || !params.serverId) return;

    try {
      const response = await fetch(`/api/apollo-execute/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverId: params.serverId,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al detener el sorteo');
      }

      // Actualizar el estado local
      setServerConfig({
        ...serverConfig,
        isrunning: false,
        pending_data: null,
        pending_category: null,
        execution_requested_at: null
      });

      toast.success('Sorteo automatizado detenido exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al detener el sorteo automatizado');
    }
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            Apollo Automatizado - Configuración
          </h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-white/90 hover:text-white"
          >
            Volver
          </button>
        </div>

        <div className="bg-black/30 backdrop-blur-xl rounded-lg border border-white/10 p-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('sorteos')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'sorteos'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              Sorteos
            </button>
            <button
              onClick={() => setActiveTab('emojis')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'emojis'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              Emojis
            </button>
            <button
              onClick={() => setActiveTab('preguntas')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'preguntas'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              Preguntas
            </button>
            <button
              onClick={() => setActiveTab('deploys')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'deploys'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              Deploys
            </button>
          </div>

          {activeTab === 'sorteos' && serverConfig && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white/90 mb-4">Configuración de Sorteos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-1">ID de Categoría</label>
                      <input
                        type="text"
                        value={serverConfig.categoryid || ''}
                        onChange={(e) => setServerConfig({...serverConfig, categoryid: e.target.value})}
                        className="w-full px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-white"
                        placeholder="ID de la categoría donde se enviarán los sorteos"
                      />
                      <p className="mt-1 text-xs text-white/50">Los sorteos se enviarán a todos los canales de texto en esta categoría</p>
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Archivo de datos (txt)</label>
                      <input
                        type="file"
                        accept=".txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const content = event.target?.result as string;
                              setServerConfig({
                                ...serverConfig,
                                dataFile: content
                              });
                            };
                            reader.readAsText(file);
                          }
                        }}
                        className="w-full px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                      />
                      <p className="mt-1 text-xs text-white/50">Formato: user:pass en cada línea</p>
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Duración del sorteo</label>
                      <input
                        type="text"
                        value={serverConfig.sorteo_duracion}
                        onChange={(e) => setServerConfig({...serverConfig, sorteo_duracion: e.target.value})}
                        className="w-full px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-white"
                        placeholder="1h"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Cantidad de ganadores</label>
                      <input
                        type="number"
                        value={serverConfig.sorteo_ganadores}
                        onChange={(e) => setServerConfig({...serverConfig, sorteo_ganadores: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-white"
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Datos por ganador</label>
                      <input
                        type="number"
                        value={serverConfig.sorteo_datos_por_ganador}
                        onChange={(e) => setServerConfig({...serverConfig, sorteo_datos_por_ganador: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-white"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Tiempo para responder</label>
                      <input
                        type="text"
                        value={serverConfig.sorteo_tiempo_respuesta}
                        onChange={(e) => setServerConfig({...serverConfig, sorteo_tiempo_respuesta: e.target.value})}
                        className="w-full px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-white"
                        placeholder="5m"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Tiempo entre sorteos</label>
                      <input
                        type="text"
                        value={serverConfig.sorteo_tiempo_espera}
                        onChange={(e) => setServerConfig({...serverConfig, sorteo_tiempo_espera: e.target.value})}
                        className="w-full px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-white"
                        placeholder="30m"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'emojis' && serverConfig && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white/90 mb-4">Configuración de Emojis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Emoji de Celebración</label>
                    <input
                      type="text"
                      value={serverConfig.emoji_celebracion || ''}
                      onChange={(e) => setServerConfig({...serverConfig, emoji_celebracion: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Emoji de Trofeo</label>
                    <input
                      type="text"
                      value={serverConfig.emoji_trofeo || ''}
                      onChange={(e) => setServerConfig({...serverConfig, emoji_trofeo: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Emoji de Reloj</label>
                    <input
                      type="text"
                      value={serverConfig.emoji_reloj || ''}
                      onChange={(e) => setServerConfig({...serverConfig, emoji_reloj: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Emoji de Error</label>
                    <input
                      type="text"
                      value={serverConfig.emoji_error || ''}
                      onChange={(e) => setServerConfig({...serverConfig, emoji_error: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Emoji de Info</label>
                    <input
                      type="text"
                      value={serverConfig.emoji_info || ''}
                      onChange={(e) => setServerConfig({...serverConfig, emoji_info: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Emoji de Fin</label>
                    <input
                      type="text"
                      value={serverConfig.emoji_fin || ''}
                      onChange={(e) => setServerConfig({...serverConfig, emoji_fin: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preguntas' && serverConfig && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white/90 mb-4">Preguntas de Verificación</h2>
                <div className="space-y-4">
                  {serverConfig.preguntas.map((pregunta, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={pregunta.question}
                          onChange={(e) => {
                            const newPreguntas = [...serverConfig.preguntas];
                            newPreguntas[index].question = e.target.value;
                            setServerConfig({...serverConfig, preguntas: newPreguntas});
                          }}
                          className="w-full px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-white"
                          placeholder="Pregunta"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={pregunta.answer}
                          onChange={(e) => {
                            const newPreguntas = [...serverConfig.preguntas];
                            newPreguntas[index].answer = e.target.value;
                            setServerConfig({...serverConfig, preguntas: newPreguntas});
                          }}
                          className="w-full px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-white"
                          placeholder="Respuesta"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newPreguntas = serverConfig.preguntas.filter((_, i) => i !== index);
                          setServerConfig({...serverConfig, preguntas: newPreguntas});
                        }}
                        className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newPreguntas = [...serverConfig.preguntas, { question: '', answer: '' }];
                      setServerConfig({...serverConfig, preguntas: newPreguntas});
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/90 hover:text-white"
                  >
                    Agregar Pregunta
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deploys' && serverConfig && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white/90 mb-4">Sorteos Automatizados Activos</h2>
                
                {serverConfig.isrunning && serverConfig.pending_data ? (
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                        <h3 className="text-lg font-medium text-white">Sorteo en Ejecución</h3>
                      </div>
                      <button
                        onClick={handleStopDeploy}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all group"
                        title="Detener sorteo"
                      >
                        <svg
                          className="w-6 h-6 text-red-400 group-hover:text-red-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-white/70">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <span>Categoría: {serverConfig.pending_category}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-white/70">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Iniciado: {new Date(serverConfig.execution_requested_at || '').toLocaleString()}</span>
                      </div>

                      <div className="flex items-center space-x-2 text-white/70">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Ganadores por sorteo: {serverConfig.sorteo_ganadores}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
                      <h3 className="text-lg font-medium text-white/70">No hay sorteos activos</h3>
                    </div>
                    <p className="mt-2 text-white/50">
                      Para iniciar un sorteo automatizado, configura los datos y haz clic en "Ejecutar Apollo"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6 pt-6 border-t border-white/10">
            <button
              onClick={handleSaveConfig}
              className="px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium"
            >
              Guardar Configuración
            </button>
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className={`px-6 py-2 rounded-lg ${
                isExecuting
                  ? 'bg-blue-500/20 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white font-medium flex items-center space-x-2`}
            >
              {isExecuting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white/90 rounded-full animate-spin"></div>
                  <span>Ejecutando...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span>Ejecutar Apollo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 