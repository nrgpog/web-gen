'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

interface Option {
  id: number;
  name: string;
  created_at: string;
}

interface StockItem {
  id: number;
  data: string;
  created_at: string;
}

interface Message {
  type: 'success' | 'error';
  text: string;
}

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
  </svg>
);

const StockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1zm3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4h-3.5zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5z"/>
  </svg>
);

const EditIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

export default function ServerPage({ params }: { params: Promise<{ serverId: string }> }) {
  const { serverId } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'add' | 'view' | 'config'>('add');
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [selectedViewOption, setSelectedViewOption] = useState<Option | null>(null);
  const [stockData, setStockData] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [isDeletingAllStock, setIsDeletingAllStock] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [newOptionName, setNewOptionName] = useState('');
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(1);
  const [editingOption, setEditingOption] = useState<number | null>(null);
  const [newOptionNameEdit, setNewOptionNameEdit] = useState('');
  const [menu1Cooldown, setMenu1Cooldown] = useState(0);
  const [menu2Cooldown, setMenu2Cooldown] = useState(0);
  const [menu1DeleteOnUse, setMenu1DeleteOnUse] = useState(false);
  const [menu2DeleteOnUse, setMenu2DeleteOnUse] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [serverName, setServerName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<string[]>([]);

  const templates = {
    streaming: [
      "hbo max",
      "netflix",
      "disney +",
      "crunchroll",
      "prime video",
      "vix"
    ],
    gaming: [
      "steam",
      "xbox",
      "mc",
      "valorant",
      "epic games"
    ],
    vpns: [
      "nord vpn",
      "ip vanish",
      "express vpn",
      "surfshark vpn",
      "proton vpn"
    ]
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchServerName = async () => {
      if (session?.accessToken && serverId) {
        try {
          // Primero intentar obtener el nombre desde nuestra base de datos
          const dbResponse = await fetch(`/api/server-names?serverId=${serverId}`);
          const dbData = await dbResponse.json();
          
          if (dbResponse.ok && dbData.data?.name) {
            setServerName(dbData.data.name);
            return;
          }

          // Si no está en la base de datos, obtenerlo de Discord
          const response = await fetch(`https://discord.com/api/v10/users/@me/guilds`, {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          });
          
          if (response.ok) {
            const guilds = await response.json();
            const guild = guilds.find((g: any) => g.id === serverId);
            if (guild) {
              setServerName(guild.name);
              
              // Guardar el nombre en nuestra base de datos
              await fetch('/api/server-names', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  serverId,
                  name: guild.name,
                }),
              });
            }
          }
        } catch (error) {
          console.error('Error al obtener el nombre del servidor:', error);
        }
      }
    };
    
    fetchServerName();
  }, [serverId, session]);

  useEffect(() => {
    fetchOptions();
  }, [selectedMenu]);

  useEffect(() => {
    if (activeTab === 'view' && selectedViewOption) {
      fetchOptionStock();
    }
  }, [activeTab, selectedViewOption]);

  useEffect(() => {
    fetchBotConfig();
  }, [serverId]);

  useEffect(() => {
    setMessage(null);
  }, [activeTab]);

  const fetchOptions = async () => {
    try {
      const response = await fetch(`/api/options?serverId=${serverId}&menuNumber=${selectedMenu}`);
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error("El servidor no está respondiendo correctamente");
        }
        const result = await response.json();
        throw new Error(result.error || 'Error al cargar las opciones');
      }
      const result = await response.json();
      setOptions(result.data);
    } catch (error) {
      console.error('Error al cargar las opciones:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al cargar las opciones'
      });
    }
  };

  const fetchOptionStock = async () => {
    if (!selectedViewOption) return;
    
    setIsLoadingStock(true);
    try {
      const response = await fetch(`/api/options/${serverId}/${selectedViewOption.id}/stock?menuNumber=${selectedMenu}`);
      if (!response.ok) {
        // Verificar si la respuesta es HTML
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error("El servidor no está respondiendo correctamente");
        }
        const result = await response.json();
        throw new Error(result.error || 'Error al cargar el stock');
      }
      const result = await response.json();
      setStockItems(result.data);
    } catch (error) {
      console.error('Error al cargar el stock:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al cargar el stock'
      });
    } finally {
      setIsLoadingStock(false);
    }
  };

  const fetchBotConfig = async () => {
    try {
      const response = await fetch(`/api/bot-config?serverId=${serverId}`);
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error("El servidor no está respondiendo correctamente");
        }
        const result = await response.json();
        throw new Error(result.error || 'Error al cargar la configuración del bot');
      }
      const result = await response.json();
      setMenu1Cooldown(result.data.menu1_cooldown);
      setMenu2Cooldown(result.data.menu2_cooldown);
      setMenu1DeleteOnUse(result.data.menu1_delete_on_use);
      setMenu2DeleteOnUse(result.data.menu2_delete_on_use);
    } catch (error) {
      console.error('Error al cargar la configuración del bot:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al cargar la configuración del bot'
      });
    }
  };

  const handleAddOption = async () => {
    if (!newOptionName.trim()) {
      setMessage({ type: 'error', text: 'Por favor, ingresa un nombre para la opción' });
      return;
    }

    if (options.length >= 25) {
      setMessage({ type: 'error', text: 'Se ha alcanzado el límite máximo de 25 opciones para este menú' });
      return;
    }

    setIsAddingOption(true);
    try {
      const response = await fetch(`/api/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverId,
          name: newOptionName,
          menuNumber: selectedMenu,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al crear la opción');
      }

      setMessage({ type: 'success', text: 'Opción creada exitosamente' });
      setNewOptionName('');
      fetchOptions();
    } catch (error) {
      console.error('Error al crear la opción:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al crear la opción'
      });
    } finally {
      setIsAddingOption(false);
    }
  };

  const handleBack = () => {
    window.location.href = '/';
  };

  const handleSubmit = async () => {
    if (!selectedOption) {
      setMessage({ type: 'error', text: 'Por favor, selecciona una opción' });
      return;
    }

    if (!stockData.trim()) {
      setMessage({ type: 'error', text: 'Por favor, ingresa algunos datos' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Dividir el stockData en líneas y filtrar líneas vacías
      const stockLines = stockData
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      // Procesar cada línea como un elemento individual de stock
      const promises = stockLines.map(line => 
        fetch(`/api/stock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serverId,
            optionId: selectedOption.id,
            data: line,
            menuNumber: selectedMenu,
          }),
        })
      );

      // Esperar a que todas las solicitudes se completen
      const responses = await Promise.all(promises);
      
      // Verificar si alguna solicitud falló
      for (const response of responses) {
        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("text/html")) {
            throw new Error("El servidor no está respondiendo correctamente");
          }
          const result = await response.json();
          throw new Error(result.error || 'Error al subir el stock');
        }
      }

      setMessage({ type: 'success', text: '¡Stock agregado exitosamente!' });
      setStockData('');
      setSelectedOption(null);
      
      if (activeTab === 'view' && selectedViewOption) {
        fetchOptionStock();
      }
    } catch (error) {
      console.error('Error al subir el stock:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Error al subir el stock'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOption = async (optionId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta opción? Se eliminará todo el stock asociado.')) {
      return;
    }

    // Validar y convertir los datos
    if (!serverId || !optionId) {
      console.error('[DELETE] Datos inválidos:', { serverId, optionId });
      setMessage({ 
        type: 'error', 
        text: 'Datos inválidos para eliminar la opción' 
      });
      return;
    }

    const requestData = {
      serverId: serverId.toString(),  // Asegurar que sea string
      optionId: Number(optionId)      // Asegurar que sea número
    };
    console.log('[DELETE] Datos de la solicitud:', requestData);

    try {
      console.log('[DELETE] URL:', `/api/options/delete`);
      const response = await fetch(`/api/options/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const responseInfo = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok,
        url: response.url
      };
      console.log('[DELETE] Información de la respuesta:', responseInfo);

      const responseText = await response.text();
      console.log('[DELETE] Texto de la respuesta:', responseText ? responseText : '(respuesta vacía)');

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        console.log('[DELETE] Error - Tipo de contenido:', contentType);
        
        if (contentType && contentType.includes("text/html")) {
          throw new Error("El servidor no está respondiendo correctamente (respuesta HTML)");
        }

        if (!responseText) {
          console.log('[DELETE] Error - Respuesta vacía del servidor');
          throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
        }
        
        try {
          const errorResult = JSON.parse(responseText);
          console.log('[DELETE] Error - JSON parseado:', errorResult);
          throw new Error(errorResult?.error || 'Error al eliminar la opción');
        } catch (parseError) {
          console.error('[DELETE] Error al parsear respuesta de error:', parseError);
          throw new Error(`Error del servidor (${response.status}): ${responseText || response.statusText}`);
        }
      }

      let data;
      if (!responseText) {
        console.log('[DELETE] Respuesta exitosa vacía - asumiendo éxito');
        data = { success: true };
      } else {
        try {
          data = JSON.parse(responseText);
          console.log('[DELETE] Respuesta exitosa parseada:', data);
        } catch (parseError) {
          console.error('[DELETE] Error al parsear respuesta exitosa:', parseError);
          throw new Error('Error al procesar la respuesta exitosa del servidor');
        }
      }

      console.log('[DELETE] Actualizando estado de la UI');
      setOptions(prevOptions => {
        const newOptions = prevOptions.filter(option => option.id !== optionId);
        console.log('[DELETE] Opciones actualizadas:', newOptions);
        return newOptions;
      });
      
      if (selectedOption?.id === optionId) {
        console.log('[DELETE] Limpiando opción seleccionada');
        setSelectedOption(null);
      }
      if (selectedViewOption?.id === optionId) {
        console.log('[DELETE] Limpiando opción de vista seleccionada');
        setSelectedViewOption(null);
      }

      setMessage({ type: 'success', text: data.message || 'Opción eliminada exitosamente' });
      console.log('[DELETE] Operación completada exitosamente');
      
      await fetchOptions();
    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : 'No stack trace disponible',
        type: error instanceof Error ? error.constructor.name : 'Unknown Error Type',
        requestData,
        serverId,
        optionId
      };
      
      console.error('[DELETE] Error completo:', errorDetails);
      
      setMessage({
        type: 'error',
        text: errorDetails.message
      });
    }
  };

  const handleDeleteStock = async (stockId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este stock?')) {
      return;
    }

    try {
      console.log('\n=== INICIO ELIMINACIÓN DE STOCK ===');
      console.log('Parámetros recibidos:', {
        serverId,
        stockId,
        menuNumber: selectedMenu,
        selectedViewOption: selectedViewOption || 'no seleccionado'
      });

      // Validación más estricta
      if (!serverId || !stockId) {
        throw new Error('Faltan datos requeridos para eliminar el stock');
      }

      // Encontrar el item de stock específico
      const stockItem = stockItems.find(item => item.id === stockId);
      if (!stockItem) {
        throw new Error('No se encontró el stock a eliminar');
      }

      console.log('Stock encontrado:', stockItem);

      // Construir datos de la solicitud con los nombres de parámetros correctos
      const requestData = {
        serverId: serverId.toString(),
        stockId: Number(stockId),
        menuNumber: selectedMenu
      };

      console.log('Datos de la solicitud:', JSON.stringify(requestData, null, 2));

      console.log('Enviando solicitud DELETE a /api/stock...');
      const response = await fetch('/api/stock', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const responseInfo = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok,
        url: response.url
      };
      console.log('Información de la respuesta:', responseInfo);

      const responseText = await response.text();
      console.log('Texto de la respuesta:', responseText ? responseText : '(vacío)');

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        console.error('Error en la respuesta:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          responseText: responseText || '(vacío)',
          headers: Object.fromEntries(response.headers.entries())
        });

        let errorMessage;
        if (contentType?.includes("application/json") && responseText) {
          try {
            const errorData = JSON.parse(responseText);
            console.log('Error - JSON parseado:', errorData);
            throw new Error(errorData?.error || 'Error al eliminar el stock');
          } catch (parseError) {
            console.error('Error al parsear respuesta de error:', parseError);
            errorMessage = responseText || `Error del servidor: ${response.status} ${response.statusText}`;
          }
        } else {
          errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      // Procesar respuesta exitosa
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : { success: true };
        console.log('Respuesta procesada:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('Error al parsear respuesta:', parseError);
        data = { success: true };
      }

      // Actualizar UI
      console.log('Actualizando interfaz...');
      setStockItems(prevItems => {
        const newItems = prevItems.filter(item => item.id !== stockId);
        console.log('Stock items actualizados:', newItems.length);
        return newItems;
      });

      setMessage({ 
        type: 'success', 
        text: data.message || 'Stock eliminado exitosamente' 
      });

      if (selectedViewOption) {
        console.log('Actualizando vista de stock...');
        await fetchOptionStock();
      }
    } catch (error) {
      console.error('Error al eliminar el stock:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al eliminar el stock'
      });
    }
  };

  const handleUpdateOptionName = async (optionId: number, newName: string) => {
    if (!newName.trim()) {
      setMessage({ type: 'error', text: 'El nombre no puede estar vacío' });
      return;
    }

    // Validar datos
    if (!serverId || !optionId || !newName) {
      console.error('[UPDATE] Datos inválidos:', { serverId, optionId, newName });
      setMessage({ 
        type: 'error', 
        text: 'Datos inválidos para actualizar la opción' 
      });
      return;
    }

    try {
      const response = await fetch(`/api/options/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serverId: serverId.toString(),
          optionId: Number(optionId),
          newName: newName.trim()
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error("El servidor no está respondiendo correctamente");
        }

        const text = await response.text();
        let result;
        try {
          result = text ? JSON.parse(text) : null;
        } catch (e) {
          console.error('Error al parsear la respuesta:', text);
          throw new Error('Respuesta inválida del servidor');
        }
        
        throw new Error(result?.error || 'Error al actualizar la opción');
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : { success: true };

      setOptions(prevOptions =>
        prevOptions.map(option =>
          option.id === optionId
            ? { ...option, name: newName.trim() }
            : option
        )
      );

      setMessage({ type: 'success', text: 'Opción actualizada exitosamente' });
      setEditingOption(null);
      setNewOptionNameEdit('');
    } catch (error) {
      console.error('Error al actualizar:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al actualizar la opción'
      });
    }
  };

  const handleSaveBotConfig = async () => {
    setIsSavingConfig(true);
    try {
      // Crear el objeto de datos y verificar que todos los campos estén presentes
      const configData = {
        serverId: serverId.toString(),
        menu1Cooldown: menu1Cooldown || 0,
        menu2Cooldown: menu2Cooldown || 0,
        menu1DeleteOnUse: menu1DeleteOnUse || false,
        menu2DeleteOnUse: menu2DeleteOnUse || false
      };

      console.log('Enviando configuración:', configData);

      const response = await fetch(`/api/bot-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configData)
      });

      const text = await response.text();
      console.log('Respuesta del servidor:', text);

      let result;
      try {
        result = text ? JSON.parse(text) : null;
      } catch (e) {
        console.error('Error al parsear la respuesta:', text);
        throw new Error('Respuesta inválida del servidor');
      }

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error("El servidor no está respondiendo correctamente");
        }
        
        throw new Error(result?.error || 'Error al actualizar la configuración del bot');
      }

      setMessage({ type: 'success', text: 'Configuración del bot guardada exitosamente' });
    } catch (error) {
      console.error('Error al guardar la configuración del bot:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al guardar la configuración del bot'
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return;

    const templateOptions = templates[selectedTemplate as keyof typeof templates];
    
    try {
      setIsAddingOption(true);
      
      // Crear todas las opciones de la plantilla
      const promises = templateOptions.map(optionName =>
        fetch(`/api/options`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serverId,
            name: optionName,
            menuNumber: selectedMenu,
          }),
        })
      );

      const responses = await Promise.all(promises);
      
      // Verificar si alguna solicitud falló
      for (const response of responses) {
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Error al crear las opciones');
        }
      }

      setMessage({ type: 'success', text: 'Plantilla aplicada exitosamente' });
      setSelectedTemplate(null);
      setPreviewData([]);
      fetchOptions(); // Actualizar la lista de opciones
    } catch (error) {
      console.error('Error al aplicar la plantilla:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al aplicar la plantilla'
      });
    } finally {
      setIsAddingOption(false);
    }
  };

  const handleDeleteAllStock = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar todas las opciones de este menú? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsDeletingAllStock(true);
    setMessage(null);

    try {
      const response = await fetch('/api/stock', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverId,
          menuNumber: selectedMenu,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al eliminar las opciones');
      }

      setMessage({
        type: 'success',
        text: 'Todas las opciones han sido eliminadas exitosamente',
      });

      // Limpiar todos los estados relacionados
      setStockData('');
      setSelectedOption(null);
      setSelectedViewOption(null);
      setStockItems([]); // Limpiar la lista de stock
      await fetchOptions(); // Actualizar la lista de opciones
    } catch (error) {
      console.error('Error al eliminar las opciones:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al eliminar las opciones',
      });
    } finally {
      setIsDeletingAllStock(false);
    }
  };

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

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar */}
        <div className="lg:w-64 bg-black/40 backdrop-blur-xl border-r border-white/10">
          <div className="p-6 border-b border-white/10">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-white/70 hover:text-white mb-4 transition-all hover:translate-x-1"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Volver
            </button>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Lmao V4 Gen - {serverName}
            </h2>
          </div>
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => {
                    setActiveTab('add');
                    setMessage(null);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                    activeTab === 'add'
                      ? 'bg-gray-800/50 text-white border border-gray-700 shadow-lg shadow-black/20'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  } font-medium`}
                >
                  Agregar Stock
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('view');
                    setMessage(null);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                    activeTab === 'view'
                      ? 'bg-gray-800/50 text-white border border-gray-700 shadow-lg shadow-black/20'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  } font-medium`}
                >
                  Administrar Stock
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('config');
                    setMessage(null);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                    activeTab === 'config'
                      ? 'bg-gray-800/50 text-white border border-gray-700 shadow-lg shadow-black/20'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  } font-medium`}
                >
                  Configuración Bot
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-6 lg:p-8">
              {/* Selector de Menú */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">Seleccionar Menú</h2>
                <div className="flex flex-wrap gap-4 items-center">
                  <button
                    onClick={() => {
                      setSelectedMenu(1);
                      setSelectedOption(null);
                      setSelectedViewOption(null);
                      setStockData('');
                    }}
                    className={`px-6 py-3 rounded-lg transition-all flex-grow sm:flex-grow-0 ${
                      selectedMenu === 1
                        ? 'bg-white/10 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Menú 1
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMenu(2);
                      setSelectedOption(null);
                      setSelectedViewOption(null);
                      setStockData('');
                    }}
                    className={`px-6 py-3 rounded-lg transition-all flex-grow sm:flex-grow-0 ${
                      selectedMenu === 2
                        ? 'bg-white/10 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Menú 2
                  </button>
                </div>
              </div>

              {activeTab === 'add' ? (
                <div className="space-y-6">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                    Agregar Stock - Menú {selectedMenu}
                  </h1>
                  
                  {message && (
                    <div className={`p-4 rounded-lg backdrop-blur-xl ${
                      message.type === 'success' 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/50' 
                        : 'bg-red-500/20 text-red-300 border border-red-500/50'
                    }`}>
                      {message.text}
                    </div>
                  )}

                  {/* Sección de Plantillas */}
                  <div className="p-6 rounded-xl bg-black/30 border border-white/10 mb-6">
                    <h3 className="text-xl font-semibold mb-6 text-white">Plantillas de Opciones</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      {Object.keys(templates).map((templateName) => (
                        <button
                          key={templateName}
                          onClick={() => {
                            setSelectedTemplate(templateName);
                            setPreviewData(templates[templateName as keyof typeof templates]);
                          }}
                          className={`p-4 rounded-lg text-center transition-all ${
                            selectedTemplate === templateName
                              ? 'bg-white/10 text-white border border-white/20 shadow-lg shadow-white/5'
                              : 'bg-black/20 text-white/70 hover:bg-black/30 hover:text-white border border-white/5'
                          } capitalize`}
                        >
                          {templateName}
                        </button>
                      ))}
                    </div>

                    {selectedTemplate && (
                      <div className="mt-6 p-6 bg-black/20 border border-white/10 rounded-xl">
                        <div className="flex flex-wrap justify-between items-center mb-6">
                          <h4 className="text-lg font-medium text-white">
                            Vista previa de las opciones a crear: {selectedTemplate}
                          </h4>
                          <button
                            onClick={() => {
                              setSelectedTemplate(null);
                              setPreviewData([]);
                            }}
                            className="px-4 py-2 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                          >
                            Cancelar
                          </button>
                        </div>
                        <div className="space-y-3">
                          {previewData.map((item, index) => (
                            <div 
                              key={index} 
                              className="p-4 bg-black/30 rounded-lg border border-white/5 text-white/90"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={handleApplyTemplate}
                          disabled={isAddingOption}
                          className={`mt-6 w-full px-6 py-3 rounded-lg transition-all ${
                            isAddingOption
                              ? 'bg-gray-700/50 cursor-not-allowed'
                              : 'bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-800'
                          } text-white shadow-lg shadow-black/20`}
                        >
                          {isAddingOption ? 'Creando opciones...' : 'Crear Opciones'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Botón para eliminar todas las opciones */}
                  <button
                    onClick={handleDeleteAllStock}
                    disabled={isDeletingAllStock}
                    className={`w-full py-3 px-6 rounded-lg transition-all ${
                      isDeletingAllStock
                        ? 'bg-red-500/50 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900'
                    } text-white shadow-lg shadow-red-500/20`}
                  >
                    {isDeletingAllStock ? 'Eliminando...' : 'Eliminar Opciones'}
                  </button>

                  {/* Sección para agregar nueva opción */}
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="text-xl font-semibold mb-4 text-white">
                      Agregar Nueva Opción al Menú {selectedMenu}
                    </h3>
                    <div className="flex flex-wrap gap-4 items-center justify-between mb-6 w-full">
                      <div className="flex-grow min-w-[200px] max-w-full">
                        <input
                          type="text"
                          value={newOptionName}
                          onChange={(e) => setNewOptionName(e.target.value)}
                          placeholder="Nombre de la nueva opción"
                          className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 text-white placeholder-white/50"
                        />
                      </div>
                      <button
                        onClick={handleAddOption}
                        disabled={isAddingOption}
                        className="flex-shrink-0 px-6 py-3 rounded-lg bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-800 text-white shadow-lg shadow-black/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {isAddingOption ? 'Agregando...' : 'Agregar nueva opción [N]'}
                      </button>
                    </div>
                  </div>

                  {/* Lista de opciones y formulario de stock */}
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <label className="block text-lg font-medium text-white mb-4">
                      Seleccionar Opción del Menú {selectedMenu}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-900">
                      {options.map((option) => (
                        <div
                          key={option.id}
                          className={`p-4 rounded-lg text-left flex items-center justify-between transition-all ${
                            selectedOption?.id === option.id
                              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-lg shadow-blue-500/20'
                              : 'bg-black/20 text-white/70 hover:bg-black/30 hover:text-white border border-white/5'
                          }`}
                        >
                          <button
                            onClick={() => setSelectedOption(option)}
                            className="flex items-center space-x-3 flex-grow"
                          >
                            <StockIcon />
                            <span>{option.name}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOption(option.id);
                            }}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors rounded-lg hover:bg-red-500/10"
                            title="Eliminar opción"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      ))}
                    </div>

                    {selectedOption && (
                      <div className="mt-6">
                        <label className="block text-lg font-medium text-white mb-4">
                          Data para {selectedOption.name}
                        </label>
                        <textarea
                          className="w-full h-48 px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-white/50 resize-none"
                          placeholder="Pega o escribe tu data aquí..."
                          value={stockData}
                          onChange={(e) => setStockData(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    )}

                    <button
                      onClick={handleSubmit}
                      disabled={isLoading || !selectedOption}
                      className={`w-full mt-6 py-3 px-6 rounded-lg transition-all ${
                        isLoading || !selectedOption
                          ? 'bg-blue-500/50 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900'
                      } text-white shadow-lg shadow-blue-500/20`}
                    >
                      {isLoading ? 'Subiendo...' : 'Subir'}
                    </button>
                  </div>
                </div>
              ) : activeTab === 'view' ? (
                <>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-8">
                    Administrar Stock - Menú {selectedMenu}
                  </h1>
                  
                  {message && (
                    <div className={`p-4 mb-6 rounded-lg backdrop-blur-xl ${
                      message.type === 'success' 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/50' 
                        : 'bg-red-500/20 text-red-300 border border-red-500/50'
                    }`}>
                      {message.text}
                    </div>
                  )}

                  {/* Lista de opciones */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-6 text-white">
                      Selecciona una opción para ver su stock
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {options.map((option) => (
                        <div
                          key={option.id}
                          className={`p-4 rounded-lg transition-all ${
                            selectedViewOption?.id === option.id
                              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-lg shadow-blue-500/20'
                              : 'bg-black/20 text-white/70 hover:bg-black/30 hover:text-white border border-white/5'
                          } flex justify-between items-center`}
                        >
                          <button
                            onClick={() => setSelectedViewOption(option)}
                            className="flex items-center space-x-3 flex-grow"
                          >
                            <StockIcon />
                            <span>{option.name}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOption(option.id);
                            }}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors rounded-lg hover:bg-red-500/10"
                            title="Eliminar opción"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stock de la opción seleccionada */}
                  {selectedViewOption && (
                    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-white">
                          Stock de: {selectedViewOption.name}
                        </h3>
                        <button
                          onClick={() => setSelectedViewOption(null)}
                          className="text-white/70 hover:text-white transition-colors"
                        >
                          Volver a opciones
                        </button>
                      </div>

                      {isLoadingStock ? (
                        <div className="text-center py-12 text-white/70">Cargando stock...</div>
                      ) : stockItems.length === 0 ? (
                        <div className="text-center py-12 text-white/70">
                          No hay stock disponible para esta opción
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {stockItems.map((item) => (
                            <div
                              key={item.id}
                              className="relative border border-white/10 rounded-lg p-4 bg-black/20 hover:bg-black/30 transition-all group"
                            >
                              <div className="flex justify-between items-start">
                                <div className="font-mono text-sm text-white/50 mb-2">
                                  ID: {item.id}
                                </div>
                                <button
                                  onClick={() => handleDeleteStock(item.id)}
                                  className="p-2 text-red-400 hover:text-red-300 transition-colors rounded-lg hover:bg-red-500/10"
                                  title="Eliminar stock"
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                              <div className="text-white/90 group-hover:text-white">
                                {item.data}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-6">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent mb-8">
                    Configuración del Bot - Menú {selectedMenu}
                  </h1>

                  {message && (
                    <div className={`p-4 mb-6 rounded-lg backdrop-blur-xl ${
                      message.type === 'success' 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/50' 
                        : 'bg-red-500/20 text-red-300 border border-red-500/50'
                    }`}>
                      {message.text}
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Configuración de Cooldown */}
                    <div className="p-6 rounded-xl bg-black/30 border border-white/10">
                      <h2 className="text-xl font-semibold mb-4 text-white">Configuración de Cooldown</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-base font-medium text-white/90 mb-2">
                            Cooldown Menú {selectedMenu} (segundos)
                          </label>
                          <input
                            type="number"
                            value={selectedMenu === 1 ? menu1Cooldown : menu2Cooldown}
                            onChange={(e) => {
                              const value = Math.max(0, parseInt(e.target.value) || 0);
                              selectedMenu === 1 ? setMenu1Cooldown(value) : setMenu2Cooldown(value);
                            }}
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 text-white placeholder-white/50"
                            min="0"
                          />
                          <p className="mt-2 text-sm text-white/60">
                            Tiempo de espera entre generaciones para el Menú {selectedMenu}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Configuración de Borrado Automático */}
                    <div className="p-6 rounded-xl bg-black/30 border border-white/10">
                      <h2 className="text-xl font-semibold mb-4 text-white">Configuración de Borrado Automático</h2>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5">
                          <div>
                            <h3 className="font-medium text-white">Borrado Automático Menú {selectedMenu}</h3>
                            <p className="text-sm text-white/60">
                              El stock se eliminará automáticamente después de ser generado
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              selectedMenu === 1 
                                ? setMenu1DeleteOnUse(!menu1DeleteOnUse)
                                : setMenu2DeleteOnUse(!menu2DeleteOnUse);
                            }}
                            className={`${
                              (selectedMenu === 1 ? menu1DeleteOnUse : menu2DeleteOnUse) 
                                ? 'bg-gray-200' 
                                : 'bg-gray-700'
                            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-white/30`}
                          >
                            <span
                              aria-hidden="true"
                              className={`${
                                (selectedMenu === 1 ? menu1DeleteOnUse : menu2DeleteOnUse)
                                  ? 'translate-x-5 bg-gray-800'
                                  : 'translate-x-0 bg-white'
                              } pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Botón de Guardar */}
                    <button
                      onClick={handleSaveBotConfig}
                      disabled={isSavingConfig}
                      className={`w-full py-3 px-6 rounded-lg transition-all ${
                        isSavingConfig
                          ? 'bg-gray-700/50 cursor-not-allowed'
                          : 'bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-800'
                      } text-white shadow-lg shadow-black/20`}
                    >
                      {isSavingConfig ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}