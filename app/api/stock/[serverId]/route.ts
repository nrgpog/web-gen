import { NextResponse } from 'next/server';
import { getServerStock } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';

type Params = {
  serverId: string;
};

export async function GET(
  request: Request,
  context: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const menuNumber = parseInt(searchParams.get('menuNumber') || '1');
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (!params?.serverId) {
      return NextResponse.json(
        { error: 'ID del servidor no proporcionado' },
        { status: 400 }
      );
    }

    const stock = await getServerStock(params.serverId, menuNumber);
    return NextResponse.json({ success: true, data: stock });
  } catch (error: any) {
    console.error('Error al obtener el stock:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener el stock' },
      { status: 500 }
    );
  }
} 