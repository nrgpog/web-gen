import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/options';

export async function POST(request: Request) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener datos del request
    const { serverId, categoryId, dataFile } = await request.json();

    if (!serverId || !categoryId || !dataFile) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Inicializar Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Actualizar la configuración con los datos pendientes
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
      console.error('Error al actualizar configuración:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar configuración' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitud de ejecución enviada exitosamente'
    });
  } catch (error) {
    console.error('Error al ejecutar Apollo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 