import { NextResponse } from 'next/server';
import { deleteStockItem } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';

type Params = {
  serverId: string;
  stockId: string;
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

    if (!params.serverId || !params.stockId) {
      return NextResponse.json(
        { error: 'ServerId y stockId son requeridos' },
        { status: 400 }
      );
    }

    try {
      await deleteStockItem(
        params.serverId, 
        parseInt(params.stockId),
        1
      );

      return NextResponse.json({ 
        success: true,
        message: 'Stock eliminado correctamente'
      });
    } catch (dbError: any) {
      return NextResponse.json(
        { error: dbError.message || 'Error al eliminar el stock en la base de datos' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al eliminar el stock' },
      { status: 500 }
    );
  }
} 