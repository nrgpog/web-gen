import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/options';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

type Params = { params: Promise<{ serverId: string }> };

export async function GET(
  request: Request,
  { params }: Params
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
      });
    }

    const serverId = resolvedParams.serverId;
    if (!serverId) {
      return new NextResponse(
        JSON.stringify({ error: 'ID del servidor es requerido' }),
        { status: 400 }
      );
    }

    const { data: existingConfig, error: fetchError } = await supabase
      .from('apollo_configs')
      .select('*')
      .eq('serverid', serverId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error al obtener la configuración:', fetchError);
      return new NextResponse(
        JSON.stringify({ error: 'Error al obtener la configuración' }),
        { status: 500 }
      );
    }

    if (!existingConfig) {
      const { data: newConfig, error: insertError } = await supabase
        .from('apollo_configs')
        .insert([
          {
            serverid: serverId,
            isrunning: false,
            lastrun: null,
            sorteo_duracion: '1h',
            sorteo_ganadores: 1,
            sorteo_datos_por_ganador: 1,
            sorteo_tiempo_respuesta: '5m',
            sorteo_tiempo_espera: '30m',
            preguntas: [],
            categoryid: null
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error al crear la configuración:', insertError);
        return new NextResponse(
          JSON.stringify({ error: 'Error al crear la configuración' }),
          { status: 500 }
        );
      }

      return new NextResponse(JSON.stringify({
        ...newConfig,
        serverId: newConfig.serverid,
        isRunning: newConfig.isrunning,
        lastRun: newConfig.lastrun,
        createdAt: newConfig.createdat,
        updatedAt: newConfig.updatedat,
        categoryId: newConfig.categoryid
      }));
    }

    return new NextResponse(JSON.stringify({
      ...existingConfig,
      serverId: existingConfig.serverid,
      isRunning: existingConfig.isrunning,
      lastRun: existingConfig.lastrun,
      createdAt: existingConfig.createdat,
      updatedAt: existingConfig.updatedat,
      categoryId: existingConfig.categoryid
    }));
  } catch (error) {
    console.error('Error en el servidor:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: Params
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
      });
    }

    const serverId = resolvedParams.serverId;
    if (!serverId) {
      return new NextResponse(
        JSON.stringify({ error: 'ID del servidor es requerido' }),
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData = {
      sorteo_duracion: body.sorteo_duracion,
      sorteo_ganadores: body.sorteo_ganadores,
      sorteo_datos_por_ganador: body.sorteo_datos_por_ganador,
      sorteo_tiempo_respuesta: body.sorteo_tiempo_respuesta,
      sorteo_tiempo_espera: body.sorteo_tiempo_espera,
      emoji_celebracion: body.emoji_celebracion,
      emoji_trofeo: body.emoji_trofeo,
      emoji_reloj: body.emoji_reloj,
      emoji_error: body.emoji_error,
      emoji_info: body.emoji_info,
      emoji_fin: body.emoji_fin,
      preguntas: body.preguntas,
      categoryid: body.categoryId
    };

    const { data: updatedConfig, error: updateError } = await supabase
      .from('apollo_configs')
      .update(updateData)
      .eq('serverid', serverId)
      .select()
      .single();

    if (updateError) {
      console.error('Error al actualizar la configuración:', updateError);
      return new NextResponse(
        JSON.stringify({ error: 'Error al actualizar la configuración' }),
        { status: 500 }
      );
    }

    return new NextResponse(JSON.stringify({
      ...updatedConfig,
      serverId: updatedConfig.serverid,
      isRunning: updatedConfig.isrunning,
      lastRun: updatedConfig.lastrun,
      createdAt: updatedConfig.createdat,
      updatedAt: updatedConfig.updatedat,
      categoryId: updatedConfig.categoryid
    }));
  } catch (error) {
    console.error('Error en el servidor:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500 }
    );
  }
} 