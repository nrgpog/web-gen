import { NextResponse } from 'next/server';
import { addOption, getServerOptions } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/options';

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
    const menuNumber = searchParams.get('menuNumber');

    if (!serverId || !menuNumber) {
      return NextResponse.json(
        { error: 'ServerId y menuNumber son requeridos' },
        { status: 400 }
      );
    }

    const options = await getServerOptions(serverId, parseInt(menuNumber));
    return NextResponse.json({ success: true, data: options });
  } catch (error: any) {
    console.error('Error al obtener opciones:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener opciones' },
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

    const { serverId, name, menuNumber } = await request.json();

    if (!serverId || !name || !menuNumber) {
      return NextResponse.json(
        { error: 'ServerId, name y menuNumber son requeridos' },
        { status: 400 }
      );
    }

    try {
      const option = await addOption(serverId, name, menuNumber);
      return NextResponse.json({ success: true, data: option });
    } catch (error) {
      if (error instanceof Error && error.message.includes('límite máximo de 25 opciones')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error al crear opción:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear opción' },
      { status: 500 }
    );
  }
} 