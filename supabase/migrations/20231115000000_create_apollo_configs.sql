drop table if exists apollo_configs;

create table apollo_configs (
    serverid text primary key,
    sorteo_duracion text not null default '1h',
    sorteo_tiempo_respuesta text not null default '24h',
    sorteo_tiempo_espera text not null default '5m',
    sorteo_ganadores integer not null default 1,
    sorteo_datos_por_ganador integer not null default 1,
    isrunning boolean not null default false,
    lastrun timestamp with time zone,
    categoryid text,
    -- Configuración de emojis
    emoji_celebracion text,
    emoji_trofeo text,
    emoji_reloj text,
    emoji_error text,
    emoji_info text,
    emoji_fin text,
    -- Configuración de preguntas
    preguntas jsonb default '[]'::jsonb,
    -- Datos de ejecución
    pending_data text,
    pending_category text,
    execution_requested_at timestamp with time zone
); 