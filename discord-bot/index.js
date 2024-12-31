const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Inicializar el cliente de Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// Inicializar el cliente de Supabase
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

// Mapa para almacenar los cooldowns por usuario y menú
const cooldowns = new Map();

client.once('ready', () => {
  console.log('Bot está listo!');
});

async function getBotConfig(serverId) {
  try {
    const { data, error } = await supabase
      .from('bot_config')
      .select('*')
      .eq('server_id', serverId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Si no hay configuración, usar valores por defecto
    if (!data) {
      return {
        menu1_cooldown: 60,
        menu2_cooldown: 60
      };
    }

    return data;
  } catch (error) {
    console.error('Error al obtener la configuración del bot:', error);
    // Valores por defecto en caso de error
    return {
      menu1_cooldown: 60,
      menu2_cooldown: 60
    };
  }
}

function checkCooldown(userId, menuNumber, cooldownTime) {
  const key = `${userId}-${menuNumber}`;
  const now = Date.now();
  const cooldownData = cooldowns.get(key);

  if (cooldownData) {
    const timeLeft = cooldownData + (cooldownTime * 1000) - now;
    if (timeLeft > 0) {
      return Math.ceil(timeLeft / 1000);
    }
  }

  cooldowns.set(key, now);
  return 0;
}

async function getRandomStock(serverId, optionId, menuNumber) {
  try {
    // Obtener directamente un stock aleatorio
    const { data, error } = await supabase
      .from('stock')
      .select('*')
      .match({
        server_id: serverId,
        option_id: optionId,
        menu_number: menuNumber
      });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    // Seleccionar un elemento aleatorio del stock
    const randomIndex = Math.floor(Math.random() * data.length);
    return data[randomIndex];
  } catch (error) {
    console.error('Error al obtener stock:', error);
    return null;
  }
}

async function getServerOptions(serverId, menuNumber) {
  try {
    const { data, error } = await supabase
      .from('options')
      .select('*')
      .eq('server_id', serverId)
      .eq('menu_number', menuNumber)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener opciones:', error);
    return [];
  }
}

async function deleteStock(serverId, stockId, menuNumber) {
  try {
    console.log('=== INICIO ELIMINACIÓN DE STOCK ===');
    console.log('Parámetros recibidos:', { serverId, stockId, menuNumber });

    // Convertir stockId a BIGINT (string para mantener precisión)
    const stockIdBigInt = stockId.toString();

    console.log('Llamando a delete_stock_item_v2 con parámetros:', {
      p_server_id: serverId,
      p_stock_id: stockIdBigInt,
      p_menu_number: menuNumber
    });

    // Ejecutar la eliminación directamente con RPC
    const { data, error } = await supabase.rpc('delete_stock_item_v2', {
      p_server_id: serverId,
      p_stock_id: stockIdBigInt,
      p_menu_number: menuNumber
    });

    if (error) {
      console.error('Error al eliminar stock:', error);
      console.error('Detalles del error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return false;
    }

    console.log('Respuesta de delete_stock_item_v2:', data);
    console.log('Stock eliminado exitosamente');
    console.log('=== FIN ELIMINACIÓN DE STOCK ===');
    return true;
  } catch (error) {
    console.error('Error inesperado al eliminar stock:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

async function getAndLockStock(serverId, optionId, menuNumber) {
  try {
    // Usamos una transacción para asegurar que el stock no pueda ser seleccionado por otro proceso
    const { data: stock, error } = await supabase.rpc('get_and_lock_stock', {
      p_server_id: serverId,
      p_option_id: optionId,
      p_menu_number: menuNumber
    });

    if (error) {
      console.error('Error al obtener y bloquear stock:', error);
      throw error;
    }

    return stock;
  } catch (error) {
    console.error('Error en getAndLockStock:', error);
    return null;
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  const command = message.content.toLowerCase();
  if (command !== '!menu1' && command !== '!menu2') return;

  try {
    const menuNumber = command === '!menu1' ? 1 : 2;
    const serverId = message.guild.id;
    const options = await getServerOptions(serverId, menuNumber);

    if (options.length === 0) {
      await message.reply(`No hay opciones disponibles para el menú ${menuNumber} en este servidor.`);
      return;
    }

    // Limitar a 25 opciones y mostrar advertencia si hay más
    const displayOptions = options.slice(0, 25);
    if (options.length > 25) {
      await message.reply(`⚠️ Este menú tiene más de 25 opciones. Solo se mostrarán las primeras 25 opciones por limitaciones de Discord.`);
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`select-stock-${menuNumber}`)
      .setPlaceholder(`Selecciona una opción del Menú ${menuNumber}`)
      .addOptions(
        displayOptions.map(option => ({
          label: option.name,
          value: option.id.toString(),
          description: `Opción: ${option.name}`
        }))
      );

    const refreshButton = new ButtonBuilder()
      .setCustomId(`refresh-menu-${menuNumber}`)
      .setLabel('Actualizar')
      .setStyle(ButtonStyle.Secondary);

    const menuRow = new ActionRowBuilder().addComponents(selectMenu);
    const buttonRow = new ActionRowBuilder().addComponents(refreshButton);

    await message.reply({ components: [menuRow, buttonRow] });
  } catch (error) {
    console.error('Error al crear el menú:', error);
    await message.reply('Hubo un error al crear el menú.');
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isStringSelectMenu()) {
    try {
      const menuNumber = parseInt(interaction.customId.split('-')[2]);
      const optionId = parseInt(interaction.values[0]);
      const serverId = interaction.guild.id;
      const userId = interaction.user.id;

      // Obtener la configuración del bot
      const botConfig = await getBotConfig(serverId);
      console.log('Configuración del bot obtenida:', botConfig);
      
      const cooldownTime = menuNumber === 1 ? botConfig.menu1_cooldown : botConfig.menu2_cooldown;
      const deleteOnUse = menuNumber === 1 ? botConfig.menu1_delete_on_use : botConfig.menu2_delete_on_use;
      
      console.log('Configuración para menú', menuNumber, ':', {
        cooldownTime,
        deleteOnUse
      });

      // Primero verificamos si hay stock disponible
      const stock = await getRandomStock(serverId, optionId, menuNumber);

      if (!stock) {
        await interaction.reply({
          content: `No hay stock disponible para esta opción en el Menú ${menuNumber}.`,
          ephemeral: true
        });
        return;
      }

      // Solo verificamos el cooldown si hay stock disponible
      const timeLeft = checkCooldown(userId, menuNumber, cooldownTime);
      if (timeLeft > 0) {
        await interaction.reply({
          content: `Por favor espera ${timeLeft} segundos antes de generar del menú ${menuNumber} nuevamente.`,
          ephemeral: true
        });
        return;
      }

      console.log('Stock obtenido:', {
        id: stock.id,
        deleteOnUse: deleteOnUse
      });

      // Si deleteOnUse está activado, intentar eliminar el stock antes de enviarlo
      let deleteSuccess = true;
      if (deleteOnUse) {
        console.log(`Intentando eliminar stock ID ${stock.id} (deleteOnUse está activado)`);
        deleteSuccess = await deleteStock(serverId, stock.id, menuNumber);
        
        if (!deleteSuccess) {
          console.error('Error al eliminar el stock');
          await interaction.reply({
            content: 'Hubo un error al procesar tu solicitud. Por favor, intenta nuevamente.',
            ephemeral: true
          });
          return;
        }
      } else {
        console.log('deleteOnUse está desactivado, no se eliminará el stock');
      }

      // Enviar el mensaje con el stock solo si la eliminación fue exitosa o no era necesaria
      await interaction.reply({
        content: `🎉 Aquí está tu stock del Menú ${menuNumber}:\n\`\`\`\n${stock.data}\n\`\`\``,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error al procesar la selección:', error);
      console.error('Stack trace:', error.stack);
      await interaction.reply({
        content: 'Hubo un error al procesar tu selección.',
        ephemeral: true
      });
    }
  } else if (interaction.isButton() && interaction.customId.startsWith('refresh-menu-')) {
    try {
      const menuNumber = parseInt(interaction.customId.split('-')[2]);
      const serverId = interaction.guild.id;
      const options = await getServerOptions(serverId, menuNumber);

      if (options.length === 0) {
        await interaction.reply({
          content: `No hay opciones disponibles para el menú ${menuNumber} en este servidor.`,
          ephemeral: true
        });
        return;
      }

      const displayOptions = options.slice(0, 25);
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`select-stock-${menuNumber}`)
        .setPlaceholder(`Selecciona una opción del Menú ${menuNumber}`)
        .addOptions(
          displayOptions.map(option => ({
            label: option.name,
            value: option.id.toString(),
            description: `Opción: ${option.name}`
          }))
        );

      const refreshButton = new ButtonBuilder()
        .setCustomId(`refresh-menu-${menuNumber}`)
        .setLabel('Actualizar')
        .setStyle(ButtonStyle.Secondary);

      const menuRow = new ActionRowBuilder().addComponents(selectMenu);
      const buttonRow = new ActionRowBuilder().addComponents(refreshButton);

      await interaction.update({ components: [menuRow, buttonRow] });
    } catch (error) {
      console.error('Error al actualizar el menú:', error);
      await interaction.reply({
        content: 'Hubo un error al actualizar el menú.',
        ephemeral: true
      });
    }
  }
});

client.login(config.token); 