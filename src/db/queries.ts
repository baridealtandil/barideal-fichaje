import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

// Inicializar la conexión de forma perezosa
let sql: postgres.Sql;

function getSql() {
  if (!sql) {
    if (!databaseUrl) {
      throw new Error('DATABASE_URL no configurada en las variables de entorno.');
    }
    sql = postgres(databaseUrl);
  }
  return sql;
}

export interface Plato {
  id: string;
  nombre: string;
  establecimiento: 'la_vereda' | 'bar_ideal';
  categoria: string;
  descripcion: string | null;
  plato_compartido: boolean;
  created_at: Date;
}

export interface Mensaje {
  id: string;
  chat_id: number;
  rol: 'user' | 'model';
  contenido: string;
  created_at: Date;
}

// Buscar platos con filtros opcionales de texto y categoría
export async function buscarPlatosDb(
  establecimiento: 'la_vereda' | 'bar_ideal',
  query?: string,
  categoria?: string
): Promise<Plato[]> {
  const db = getSql();
  
  if (query && categoria) {
    return await db<Plato[]>`
      SELECT * FROM platos 
      WHERE establecimiento = ${establecimiento} 
        AND categoria = ${categoria}
        AND nombre ILIKE ${'%' + query + '%'}
      ORDER BY nombre ASC
    `;
  } else if (query) {
    return await db<Plato[]>`
      SELECT * FROM platos 
      WHERE establecimiento = ${establecimiento} 
        AND nombre ILIKE ${'%' + query + '%'}
      ORDER BY nombre ASC
    `;
  } else if (categoria) {
    return await db<Plato[]>`
      SELECT * FROM platos 
      WHERE establecimiento = ${establecimiento} 
        AND categoria = ${categoria}
      ORDER BY nombre ASC
    `;
  } else {
    return await db<Plato[]>`
      SELECT * FROM platos 
      WHERE establecimiento = ${establecimiento} 
      ORDER BY nombre ASC
    `;
  }
}

// Obtener todas las categorías únicas del establecimiento
export async function obtenerCategoriasDb(establecimiento: 'la_vereda' | 'bar_ideal'): Promise<string[]> {
  const db = getSql();
  const rows = await db`
    SELECT DISTINCT categoria FROM platos 
    WHERE establecimiento = ${establecimiento}
    ORDER BY categoria ASC
  `;
  return rows.map(r => r.categoria);
}

// Guardar un mensaje en el historial de conversación
export async function guardarMensajeDb(chatId: number, rol: 'user' | 'model', contenido: string): Promise<void> {
  const db = getSql();
  await db`
    INSERT INTO conversaciones (chat_id, rol, contenido)
    VALUES (${chatId}, ${rol}, ${contenido})
  `;
}

// Obtener historial de conversación para contexto de IA
export async function obtenerHistorialDb(chatId: number, limit = 20): Promise<Mensaje[]> {
  const db = getSql();
  return await db<Mensaje[]>`
    SELECT rol, contenido 
    FROM conversaciones 
    WHERE chat_id = ${chatId} 
    ORDER BY created_at ASC 
    LIMIT ${limit}
  `;
}
