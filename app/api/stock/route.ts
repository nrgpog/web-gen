import { NextResponse } from 'next/server';
import { addStock, deleteStockItem, deleteAllStock } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/options';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { serverId, optionId, data, menuNumber } = await request.json();

    if (!serverId || !optionId || !data || !menuNumber) {
      return NextResponse.json(
        { error: 'ServerId, optionId, menuNumber y data son requeridos' },
        { status: 400 }
      );
    }

    try {
      const result = await addStock(serverId, optionId, data, menuNumber);
      return NextResponse.json({ success: true, data: result });
    } catch (dbError: any) {
      console.error('Error en la base de datos:', dbError);
      return NextResponse.json(
        { error: dbError.message || 'Error al conectar con la base de datos' },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error('Error al procesar la solicitud:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    console.log('=== INICIO ENDPOINT DELETE STOCK ===');
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log('No hay sesión activa');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Datos recibidos en el body:', body);
    const { serverId, menuNumber } = body;

    if (!serverId || !menuNumber) {
      console.log('Faltan datos requeridos:', { serverId, menuNumber });
      return NextResponse.json(
        { error: 'ServerId y menuNumber son requeridos' },
        { status: 400 }
      );
    }

    console.log('Intentando eliminar stock y opciones con:', { serverId, menuNumber });
    try {
      await deleteAllStock(serverId, menuNumber);
      console.log('Eliminación completada exitosamente');
      return NextResponse.json({ success: true });
    } catch (dbError: any) {
      console.error('Error específico de la base de datos:', dbError);
      return NextResponse.json(
        { error: dbError.message || 'Error al conectar con la base de datos' },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error('Error general en el endpoint:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  } finally {
    console.log('=== FIN ENDPOINT DELETE STOCK ===');
  }
} 