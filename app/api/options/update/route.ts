import { NextResponse } from 'next/server';
import { updateOptionName } from '@/lib/db';
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

    const body = await request.json();
    const { serverId, optionId, newName } = body;

    if (!serverId || !optionId || !newName) {
      return NextResponse.json(
        { error: 'ServerId, optionId y newName son requeridos' },
        { status: 400 }
      );
    }

    if (newName.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre no puede estar vacío' },
        { status: 400 }
      );
    }

    try {
      const updatedOption = await updateOptionName(serverId, parseInt(optionId.toString()), newName.trim());
      
      if (!updatedOption) {
        return NextResponse.json(
          { error: 'No se pudo actualizar la opción' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true,
        data: updatedOption,
        message: 'Opción actualizada correctamente'
      });
    } catch (dbError: any) {
      console.error('Error específico de la base de datos:', dbError);
      return NextResponse.json(
        { error: dbError.message || 'Error al actualizar la opción en la base de datos' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error general al actualizar la opción:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar la opción' },
      { status: 500 }
    );
  }
} 