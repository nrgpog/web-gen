import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
  try {
    // Verificar la sesión
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el serverId del cuerpo de la petición
    const { serverId } = await request.json();
    if (!serverId) {
      return NextResponse.json({ error: 'Se requiere el ID del servidor' }, { status: 400 });
    }

    // Inicializar el cliente de Supabase
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('❌ Variables de entorno de Supabase no encontradas');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Actualizar la configuración
    const { error } = await supabase
      .from('apollo_configs')
      .update({
        isrunning: false,
        is_executing: false,
        pending_data: null,
        pending_category: null,
        execution_requested_at: null
      })
      .eq('serverid', serverId);

    if (error) {
      console.error('Error al detener el sorteo:', error);
      return NextResponse.json({ error: 'Error al detener el sorteo' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en el endpoint de detención:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 