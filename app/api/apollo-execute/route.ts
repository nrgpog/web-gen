import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
  console.log('🚀 Iniciando solicitud de ejecución de sorteo');
  
  try {
    // Verificar la sesión
    const session = await getServerSession();
    if (!session) {
      console.log('❌ No hay sesión activa');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.log('✅ Sesión verificada');

    // Obtener datos del cuerpo
    const body = await request.json();
    console.log('📦 Datos recibidos:', {
      serverId: body.serverId,
      categoryId: body.categoryId,
      dataFileLength: body.dataFile?.length || 0
    });

    const { serverId, categoryId, dataFile } = body;

    if (!serverId || !categoryId || !dataFile) {
      console.log('❌ Faltan datos requeridos:', { serverId, categoryId, hasDataFile: !!dataFile });
      return NextResponse.json(
        { error: 'Se requieren todos los campos' },
        { status: 400 }
      );
    }

    // Verificar variables de entorno
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('❌ Variables de entorno de Supabase no encontradas');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Inicializar Supabase
    console.log('🔄 Inicializando conexión con Supabase');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Verificar si ya hay un sorteo activo
    console.log('🔍 Verificando sorteos activos para el servidor:', serverId);
    const { data: existingConfig, error: existingError } = await supabase
      .from('apollo_configs')
      .select('*')
      .eq('serverid', serverId)
      .single();

    if (existingError) {
      console.error('❌ Error al verificar configuración existente:', existingError);
      return NextResponse.json(
        { error: 'Error al verificar configuración' },
        { status: 500 }
      );
    }

    if (existingConfig.isrunning) {
      console.log('⚠️ Ya hay un sorteo activo para este servidor');
      return NextResponse.json(
        { error: 'Ya hay un sorteo activo en este servidor' },
        { status: 400 }
      );
    }

    // Actualizar la configuración
    console.log('📝 Actualizando configuración en la base de datos');
    const { error: updateError } = await supabase
      .from('apollo_configs')
      .update({
        isrunning: true,
        pending_data: dataFile,
        pending_category: categoryId,
        execution_requested_at: new Date().toISOString()
      })
      .eq('serverid', serverId);

    if (updateError) {
      console.error('❌ Error al actualizar la configuración:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la configuración' },
        { status: 500 }
      );
    }

    console.log('✅ Sorteo iniciado exitosamente');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error en el endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 