import { NextResponse } from 'next/server';
import { deleteStockItem } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';

type Params = {
  id: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params;
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');
    const menuNumber = parseInt(searchParams.get('menuNumber') || '1');

    if (!serverId || !params.id) {
      return NextResponse.json(
        { error: 'ServerId y id son requeridos' },
        { status: 400 }
      );
    }

    try {
      await deleteStockItem(serverId, parseInt(params.id), menuNumber);
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error('Error en la base de datos:', dbError);
      return NextResponse.json(
        { error: 'Error al eliminar el stock en la base de datos' },
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