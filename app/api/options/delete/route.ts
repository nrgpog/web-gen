import { NextResponse } from 'next/server';
import { deleteOption } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { optionId, serverId } = data;

    if (!serverId || !optionId) {
      return NextResponse.json(
        { error: 'ServerId y optionId son requeridos' },
        { status: 400 }
      );
    }

    try {
      await deleteOption(serverId, parseInt(optionId));
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error('Error en la base de datos:', dbError);
      return NextResponse.json(
        { error: 'Error al eliminar la opción en la base de datos' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error al procesar la solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 