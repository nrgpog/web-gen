import { supabase } from './supabase';

export async function addOption(serverId: string, name: string, menuNumber: number) {
  try {
    // Primero verificar cuántas opciones existen
    const { data: existingOptions, error: countError } = await supabase
      .from('options')
      .select('*')
      .eq('server_id', serverId)
      .eq('menu_number', menuNumber);

    if (countError) {
      console.error('Error al contar opciones:', countError);
      throw new Error(countError.message);
    }

    if (existingOptions && existingOptions.length >= 25) {
      throw new Error('Se ha alcanzado el límite máximo de 25 opciones para este menú');
    }

    const { data: result, error } = await supabase
      .from('options')
      .insert([
        {
          server_id: serverId,
          name: name,
          menu_number: menuNumber,
        },
      ])
      .select();

    if (error) {
      console.error('Error al insertar opción:', error);
      throw new Error(error.message);
    }

    if (!result || result.length === 0) {
      throw new Error('No se pudo crear la opción');
    }

    return result[0];
  } catch (error) {
    console.error('Error en la base de datos:', error);
    throw error;
  }
}

export async function getServerOptions(serverId: string, menuNumber: number) {
  try {
    const { data, error } = await supabase
      .from('options')
      .select('*')
      .eq('server_id', serverId)
      .eq('menu_number', menuNumber)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error al obtener opciones:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Error en la base de datos:', error);
    throw error;
  }
}

export async function addStock(serverId: string, optionId: number, data: string, menuNumber: number) {
  try {
    const { data: result, error: insertError } = await supabase
      .from('stock')
      .insert([
        {
          server_id: serverId,
          option_id: optionId,
          data: data,
          menu_number: menuNumber,
        },
      ])
      .select();

    if (insertError) {
      console.error('Error al insertar en Supabase:', insertError);
      throw new Error(insertError.message);
    }

    if (!result || result.length === 0) {
      throw new Error('No se pudo insertar el registro');
    }

    return result[0];
  } catch (error) {
    console.error('Error en la base de datos:', error);
    throw error;
  }
}

export async function getServerStock(serverId: string, menuNumber: number) {
  try {
    const { data, error } = await supabase
      .from('stock')
      .select(`
        *,
        options:option_id (
          id,
          name
        )
      `)
      .eq('server_id', serverId)
      .eq('menu_number', menuNumber)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener el stock:', error);
      throw new Error(error.message);
    }

    const validStockItems = data?.filter(item => item.options !== null) || [];

    return validStockItems;
  } catch (error) {
    console.error('Error en la base de datos:', error);
    throw error;
  }
}

export async function getOptionStock(serverId: string, optionId: number, menuNumber: number) {
  try {
    const { data, error } = await supabase
      .from('stock')
      .select(`
        *,
        options:option_id (
          id,
          name
        )
      `)
      .eq('server_id', serverId)
      .eq('option_id', optionId)
      .eq('menu_number', menuNumber)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener el stock:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Error en la base de datos:', error);
    throw error;
  }
}

export async function deleteOption(serverId: string, optionId: number) {
  try {
    console.log('Iniciando eliminación de opción:', { serverId, optionId });

    // Primero verificamos si la opción existe
    const { data: existingOption, error: checkError } = await supabase
      .from('options')
      .select('*')
      .eq('server_id', serverId)
      .eq('id', optionId)
      .single();

    if (checkError) {
      console.error('Error al verificar la opción:', checkError);
      throw checkError;
    }

    if (!existingOption) {
      throw new Error('La opción no existe');
    }

    console.log('Opción encontrada:', existingOption);

    // Primero eliminamos todo el stock asociado a la opción
    const { error: stockError } = await supabase
      .from('stock')
      .delete()
      .eq('server_id', serverId)
      .eq('option_id', optionId);

    if (stockError) {
      console.error('Error al eliminar el stock:', stockError);
      throw stockError;
    }

    console.log('Stock eliminado');

    // Luego eliminamos la opción usando RPC (función de base de datos)
    const { error: optionError } = await supabase
      .rpc('delete_option', {
        p_server_id: serverId,
        p_option_id: optionId
      });

    if (optionError) {
      console.error('Error al eliminar la opción:', optionError);
      throw optionError;
    }

    // Verificamos que la opción ya no existe
    const { data: checkDeleted, error: checkDeletedError } = await supabase
      .from('options')
      .select('*')
      .eq('server_id', serverId)
      .eq('id', optionId)
      .maybeSingle();

    if (checkDeletedError) {
      console.error('Error al verificar la eliminación:', checkDeletedError);
      throw checkDeletedError;
    }

    if (checkDeleted) {
      console.error('La opción aún existe después de intentar eliminarla:', checkDeleted);
      throw new Error('La opción no se eliminó correctamente');
    }

    console.log('Opción eliminada exitosamente');
    return true;
  } catch (error) {
    console.error('Error al eliminar la opción:', error);
    throw error;
  }
}

export async function deleteStockItem(serverId: string, stockId: number, menuNumber: number) {
  try {
    const { error } = await supabase.rpc('delete_stock_item', {
      p_server_id: serverId,
      p_stock_id: stockId,
      p_menu_number: menuNumber
    });

    if (error) {
      console.error('Error al eliminar el stock:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error en la base de datos:', error);
    throw error;
  }
}

export async function updateOptionName(serverId: string, optionId: number, newName: string) {
  try {
    console.log('Iniciando actualización de opción:', { serverId, optionId, newName });

    // Verificamos si la opción existe
    const { data: existingOption, error: checkError } = await supabase
      .from('options')
      .select('*')
      .eq('server_id', serverId)
      .eq('id', optionId)
      .maybeSingle();

    if (checkError) {
      console.error('Error al verificar la opción:', checkError);
      throw checkError;
    }

    if (!existingOption) {
      throw new Error('La opción no existe');
    }

    console.log('Opción encontrada:', existingOption);

    // Actualizamos el nombre usando RPC para asegurar la actualización
    const { error: updateError } = await supabase
      .rpc('update_option_name', {
        p_server_id: serverId,
        p_option_id: optionId,
        p_new_name: newName
      });

    if (updateError) {
      console.error('Error al actualizar la opción:', updateError);
      throw updateError;
    }

    // Verificamos que la actualización fue exitosa
    const { data: updatedOption, error: getError } = await supabase
      .from('options')
      .select('*')
      .eq('server_id', serverId)
      .eq('id', optionId)
      .maybeSingle();

    if (getError) {
      console.error('Error al obtener la opción actualizada:', getError);
      throw getError;
    }

    if (!updatedOption) {
      throw new Error('No se pudo obtener la opción actualizada');
    }

    if (updatedOption.name !== newName) {
      throw new Error('La actualización no se aplicó correctamente');
    }

    console.log('Opción actualizada exitosamente:', updatedOption);
    return updatedOption;
  } catch (error) {
    console.error('Error al actualizar el nombre de la opción:', error);
    throw error;
  }
}

export async function deleteAllStock(serverId: string, menuNumber: number) {
  try {
    console.log('=== INICIO ELIMINACIÓN DE TODO EL STOCK Y OPCIONES ===');
    console.log('Parámetros recibidos:', { serverId, menuNumber });

    // Primero verificamos cuánto stock y opciones hay antes de eliminar
    const { data: initialStock } = await supabase
      .from('stock')
      .select('*')
      .eq('server_id', serverId)
      .eq('menu_number', menuNumber);

    const { data: initialOptions } = await supabase
      .from('options')
      .select('*')
      .eq('server_id', serverId)
      .eq('menu_number', menuNumber);

    console.log('Estado inicial:', {
      stockCount: initialStock?.length || 0,
      optionsCount: initialOptions?.length || 0
    });

    // Usar RPC para eliminar todo
    console.log('Llamando a función RPC para eliminar todo...');
    const { error: rpcError } = await supabase.rpc('delete_all_menu_data', {
      p_server_id: serverId,
      p_menu_number: menuNumber
    });

    if (rpcError) {
      console.error('Error al eliminar datos del menú:', rpcError);
      throw rpcError;
    }
    console.log('Función RPC ejecutada exitosamente');

    // Verificamos que todo se eliminó
    const { data: remainingStock } = await supabase
      .from('stock')
      .select('*')
      .eq('server_id', serverId)
      .eq('menu_number', menuNumber);

    const { data: remainingOptions } = await supabase
      .from('options')
      .select('*')
      .eq('server_id', serverId)
      .eq('menu_number', menuNumber);

    console.log('Estado final:', {
      stockRestante: remainingStock?.length || 0,
      opcionesRestantes: remainingOptions?.length || 0
    });

    if ((remainingStock?.length || 0) > 0 || (remainingOptions?.length || 0) > 0) {
      throw new Error('No se eliminaron todos los datos correctamente');
    }

    console.log('=== FIN ELIMINACIÓN DE TODO EL STOCK Y OPCIONES ===');
    return true;
  } catch (error) {
    console.error('Error en la base de datos:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace disponible');
    throw error;
  }
} 