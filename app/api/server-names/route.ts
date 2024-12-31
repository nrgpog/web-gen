import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/options';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');

    if (!serverId) {
      return NextResponse.json(
        { error: 'ServerId es requerido' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('server_names')
      .select('name')
      .eq('server_id', serverId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error al obtener el nombre del servidor:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener el nombre del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { serverId, name } = body;

    if (!serverId || !name) {
      return NextResponse.json(
        { error: 'ServerId y name son requeridos' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('server_names')
      .upsert(
        { server_id: serverId, name },
        { onConflict: 'server_id' }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error al guardar el nombre del servidor:', error);
    return NextResponse.json(
      { error: error.message || 'Error al guardar el nombre del servidor' },
      { status: 500 }
    );
  }
} 