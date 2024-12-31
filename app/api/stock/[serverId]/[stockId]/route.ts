import { NextResponse } from 'next/server';
import { deleteStockItem } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';

type Params = {
  serverId: string;
  stockId: string;
};

export async function DELETE(
  request: Request,
  context: { params: Promise<Params> }
) {
  console.log('Recibida solicitud DELETE para stock:', context);

  try {
    const session = await getServerSession(authOptions);
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const menuNumber = parseInt(searchParams.get('menuNumber') || '1');
    
    if (!session) {
      console.log('No hay sesión activa');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (!params.serverId || !params.stockId) {
      console.log('Faltan parámetros requeridos:', params);
      return NextResponse.json(
        { error: 'ServerId y stockId son requeridos' },
        { status: 400 }
      );
    }

    console.log('Intentando eliminar stock con:', {
      serverId: params.serverId,
      stockId: parseInt(params.stockId),
      menuNumber
    });

    try {
      await deleteStockItem(params.serverId, parseInt(params.stockId), menuNumber);
      
      console.log('Stock eliminado exitosamente');
      return new NextResponse(
        JSON.stringify({ 
          success: true,
          message: 'Stock eliminado correctamente'
        }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    } catch (dbError: any) {
      console.error('Error específico de la base de datos:', dbError);
      return new NextResponse(
        JSON.stringify({ 
          error: dbError.message || 'Error al eliminar el stock en la base de datos'
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
  } catch (error: any) {
    console.error('Error general al eliminar el stock:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: error.message || 'Error al eliminar el stock'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
} 