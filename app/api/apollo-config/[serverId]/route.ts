import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { serverId: string } }
) {
  try {
    // Verificar sesión
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Inicializar Supabase
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Extraer y validar serverId de manera asíncrona
    const serverId = params.serverId;
    if (!serverId) {
      return NextResponse.json(
        { error: 'ServerId no proporcionado' },
        { status: 400 }
      );
    }

    const { data: config, error } = await supabase
      .from('apollo_configs')
      .select('*')
      .eq('serverid', serverId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener configuración' },
        { status: 500 }
      );
    }

    // Si isrunning es true pero no hay datos pendientes, corregir el estado
    if (config.isrunning && !config.pending_data && !config.is_executing) {
      const { error: updateError } = await supabase
        .from('apollo_configs')
        .update({
          isrunning: false,
          execution_requested_at: null
        })
        .eq('serverid', serverId);

      if (!updateError) {
        config.isrunning = false;
        config.execution_requested_at = null;
      }
    }

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { serverId: string } }
) {
  try {
    console.log('📝 PUT /api/apollo-config/[serverId] - Iniciando actualización');

    const session = await getServerSession();
    if (!session) {
      console.log('❌ No hay sesión activa');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Extraer y validar serverId
    const serverId = params.serverId;
    if (!serverId) {
      console.error('❌ ServerId no proporcionado');
      return NextResponse.json(
        { error: 'ServerId no proporcionado' },
        { status: 400 }
      );
    }
    console.log('🆔 Actualizando configuración para servidor:', serverId);

    const body = await request.json();
    console.log('📦 Datos recibidos para actualizar:', {
      isrunning: body.isrunning,
      pending_data: body.pending_data ? 'Tiene datos' : 'No tiene datos',
      pending_category: body.pending_category,
      execution_requested_at: body.execution_requested_at
    });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('apollo_configs')
      .update(body)
      .eq('serverid', serverId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error al actualizar configuración:', error);
      return NextResponse.json(
        { error: 'Error al actualizar configuración' },
        { status: 500 }
      );
    }

    console.log('✅ Configuración actualizada exitosamente');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error en el endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 