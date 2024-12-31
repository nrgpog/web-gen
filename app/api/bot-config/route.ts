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
      .from('bot_config')
      .select('*')
      .eq('server_id', serverId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Si no hay configuración, devolver valores por defecto
    if (!data) {
      return NextResponse.json({
        success: true,
        data: {
          server_id: serverId,
          menu1_cooldown: 60,
          menu2_cooldown: 60,
          menu1_delete_on_use: false,
          menu2_delete_on_use: false
        }
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error al obtener la configuración del bot:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener la configuración del bot' },
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
    console.log('Datos recibidos:', body);

    const { serverId, menu1Cooldown, menu2Cooldown, menu1DeleteOnUse, menu2DeleteOnUse } = body;

    // Validación más detallada
    if (!serverId) {
      return NextResponse.json({ error: 'ServerId es requerido' }, { status: 400 });
    }
    if (menu1Cooldown === undefined) {
      return NextResponse.json({ error: 'menu1Cooldown es requerido' }, { status: 400 });
    }
    if (menu2Cooldown === undefined) {
      return NextResponse.json({ error: 'menu2Cooldown es requerido' }, { status: 400 });
    }
    if (menu1DeleteOnUse === undefined) {
      return NextResponse.json({ error: 'menu1DeleteOnUse es requerido' }, { status: 400 });
    }
    if (menu2DeleteOnUse === undefined) {
      return NextResponse.json({ error: 'menu2DeleteOnUse es requerido' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('bot_config')
      .upsert({
        server_id: serverId,
        menu1_cooldown: menu1Cooldown,
        menu2_cooldown: menu2Cooldown,
        menu1_delete_on_use: menu1DeleteOnUse,
        menu2_delete_on_use: menu2DeleteOnUse
      }, {
        onConflict: 'server_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error de Supabase:', error);
      throw error;
    }

    console.log('Configuración guardada:', data);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error al guardar la configuración del bot:', error);
    return NextResponse.json(
      { error: error.message || 'Error al guardar la configuración del bot' },
      { status: 500 }
    );
  }
} 