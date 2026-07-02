-- Crear extension para UUIDs si no existe (Postgres 13+ la tiene por defecto como gen_random_uuid())
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de platos
CREATE TABLE IF NOT EXISTS platos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    establecimiento VARCHAR(50) NOT NULL CHECK (establecimiento IN ('la_vereda', 'bar_ideal')),
    categoria VARCHAR(100) NOT NULL,
    descripcion TEXT,
    plato_compartido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de recetas
CREATE TABLE IF NOT EXISTS recetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plato_id UUID NOT NULL REFERENCES platos(id) ON DELETE CASCADE,
    preparacion TEXT,
    tips TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ingredientes
CREATE TABLE IF NOT EXISTS ingredientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) UNIQUE NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL, -- 'g', 'kg', 'ml', 'l', 'unidades', etc.
    proveedor VARCHAR(255),
    costo NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla intermedia de ingredientes en recetas
CREATE TABLE IF NOT EXISTS receta_ingredientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receta_id UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
    ingrediente_id UUID NOT NULL REFERENCES ingredientes(id) ON DELETE RESTRICT,
    cantidad NUMERIC(10, 3) NOT NULL, -- cantidad por porción
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de historial de menú
CREATE TABLE IF NOT EXISTS historial_menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    plato_id UUID NOT NULL REFERENCES platos(id) ON DELETE CASCADE,
    establecimiento VARCHAR(50) NOT NULL CHECK (establecimiento IN ('la_vereda', 'bar_ideal')),
    tipo_menu VARCHAR(50) NOT NULL, -- 'plato_del_dia', 'sugerencia', 'carta', etc.
    cantidad_vendida INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de conversaciones (memoria del bot)
CREATE TABLE IF NOT EXISTS conversaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id BIGINT NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('user', 'model')),
    contenido TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_platos_establecimiento ON platos(establecimiento);
CREATE INDEX IF NOT EXISTS idx_historial_menu_fecha ON historial_menu(fecha);
CREATE INDEX IF NOT EXISTS idx_conversaciones_chat_id ON conversaciones(chat_id);
