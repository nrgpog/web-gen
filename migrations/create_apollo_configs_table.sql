-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS update_apollo_configs_updated_at ON apollo_configs;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP TABLE IF EXISTS apollo_configs;

-- Create apollo_configs table
CREATE TABLE IF NOT EXISTS apollo_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    serverid TEXT NOT NULL,
    isrunning BOOLEAN DEFAULT false,
    lastrun TIMESTAMP WITH TIME ZONE,
    -- Configuración de sorteos
    sorteo_duracion TEXT DEFAULT '1h',
    sorteo_ganadores INTEGER DEFAULT 1,
    sorteo_datos_por_ganador INTEGER DEFAULT 1,
    sorteo_tiempo_respuesta TEXT DEFAULT '5m',
    sorteo_tiempo_espera TEXT DEFAULT '30m',
    -- Configuración de emojis
    emoji_celebracion TEXT,
    emoji_trofeo TEXT,
    emoji_reloj TEXT,
    emoji_error TEXT,
    emoji_info TEXT,
    emoji_fin TEXT,
    -- Configuración de preguntas
    preguntas JSONB DEFAULT '[]'::jsonb,
    -- Configuración de categoría
    categoryid TEXT,
    -- Datos pendientes de ejecución
    pending_data TEXT,
    pending_category TEXT,
    execution_requested_at TIMESTAMP WITH TIME ZONE,
    -- Timestamps
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(serverid)
);

-- Create trigger to update updatedat
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_apollo_configs_updated_at
    BEFORE UPDATE ON apollo_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 