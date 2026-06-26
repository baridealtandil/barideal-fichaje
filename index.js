/**
 * API Bar Ideal — Bun + Hono
 * Extiende la API base de La Vereda con:
 *   - Horarios semanales con doble turno
 *   - Endpoint batch para importar planilla
 *   - Soporte de tipo: entrada / salida / entrada2 / salida2
 *
 * Variables de entorno requeridas (Railway):
 *   DATABASE_URL  — PostgreSQL connection string
 *   PORT          — puerto (Railway lo inyecta automáticamente)
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { sql } from "bun";

const app = new Hono();
app.use("/*", cors());

// ══════════════════════════════════════════════════
//  MIGRACIÓN — ejecutar al arrancar
// ══════════════════════════════════════════════════
async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS empleados (
      id         SERIAL PRIMARY KEY,
      nombre     TEXT NOT NULL,
      apellido   TEXT NOT NULL,
      celular    TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS fichajes (
      id          SERIAL PRIMARY KEY,
      empleado_id INTEGER NOT NULL REFERENCES empleados(id),
      tipo        TEXT NOT NULL CHECK (tipo IN ('entrada','salida','entrada2','salida2')),
      lat         FLOAT8,
      lng         FLOAT8,
      fecha_hora  TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS horarios (
      id          SERIAL PRIMARY KEY,
      empleado_id INTEGER NOT NULL REFERENCES empleados(id),
      fecha       DATE NOT NULL,
      entrada     TIME,
      salida      TIME,
      entrada2    TIME,
      salida2     TIME,
      UNIQUE(empleado_id, fecha)
    )
  `;

  // Índices de performance
  await sql`CREATE INDEX IF NOT EXISTS idx_fichajes_empleado ON fichajes(empleado_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_fichajes_fecha ON fichajes(fecha_hora)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_horarios_empfecha ON horarios(empleado_id, fecha)`;

  console.log("✅ Migración completada");
}

// ══════════════════════════════════════════════════
//  EMPLEADOS
// ══════════════════════════════════════════════════

// Registrar o recuperar empleado por celular
app.post("/api/empleados", async (c) => {
  const { nombre, apellido, celular } = await c.req.json();

  if (!nombre || !apellido || !celular) {
    return c.json({ error: "nombre, apellido y celular son requeridos" }, 400);
  }

  const existing = await sql`
    SELECT * FROM empleados WHERE celular = ${celular} LIMIT 1
  `;
  if (existing.length > 0) return c.json(existing[0], 200);

  const [empleado] = await sql`
    INSERT INTO empleados (nombre, apellido, celular)
    VALUES (${nombre.trim()}, ${apellido.trim()}, ${celular.trim()})
    RETURNING *
  `;
  return c.json(empleado, 201);
});

// Listar todos los empleados
app.get("/api/empleados/list", async (c) => {
  const empleados = await sql`
    SELECT * FROM empleados ORDER BY apellido, nombre ASC
  `;
  return c.json(empleados);
});

// Obtener empleado por ID
app.get("/api/empleados/:id", async (c) => {
  const id = c.req.param("id");
  const [empleado] = await sql`
    SELECT * FROM empleados WHERE id = ${id}
  `;
  if (!empleado) return c.json({ error: "Empleado no encontrado" }, 404);
  return c.json(empleado);
});

// ══════════════════════════════════════════════════
//  FICHAJES
// ══════════════════════════════════════════════════

// Registrar fichaje
app.post("/api/fichajes", async (c) => {
  const { empleado_id, tipo, lat, lng } = await c.req.json();

  const tiposValidos = ["entrada", "salida", "entrada2", "salida2"];
  if (!tiposValidos.includes(tipo)) {
    return c.json({ error: "tipo inválido. Use: entrada, salida, entrada2, salida2" }, 400);
  }

  // Verificar que el empleado existe
  const [emp] = await sql`SELECT id FROM empleados WHERE id = ${empleado_id}`;
  if (!emp) return c.json({ error: "Empleado no encontrado" }, 404);

  // Evitar duplicados en el mismo día
  const hoy = new Date().toISOString().split("T")[0];
  const dup = await sql`
    SELECT id FROM fichajes
    WHERE empleado_id = ${empleado_id}
      AND tipo = ${tipo}
      AND fecha_hora::date = ${hoy}::date
    LIMIT 1
  `;
  if (dup.length > 0) {
    return c.json({ error: `Ya existe un fichaje de tipo '${tipo}' hoy`, existing: dup[0] }, 409);
  }

  const [fichaje] = await sql`
    INSERT INTO fichajes (empleado_id, tipo, lat, lng, fecha_hora)
    VALUES (${empleado_id}, ${tipo}, ${lat}, ${lng}, NOW())
    RETURNING *
  `;
  return c.json(fichaje, 201);
});

// Listar fichajes (con filtros opcionales)
app.get("/api/fichajes", async (c) => {
  const emp_id = c.req.query("empleado_id");
  const fecha = c.req.query("fecha"); // YYYY-MM-DD

  if (emp_id && fecha) {
    // Fichajes de un empleado en una fecha específica (para historial de hoy)
    const fichajes = await sql`
      SELECT f.*, e.nombre, e.apellido, e.celular
      FROM fichajes f
      JOIN empleados e ON f.empleado_id = e.id
      WHERE f.empleado_id = ${emp_id}
        AND f.fecha_hora::date = ${fecha}::date
      ORDER BY f.fecha_hora ASC
    `;
    return c.json(fichajes);
  }

  if (emp_id) {
    const fichajes = await sql`
      SELECT f.*, e.nombre, e.apellido, e.celular
      FROM fichajes f
      JOIN empleados e ON f.empleado_id = e.id
      WHERE f.empleado_id = ${emp_id}
      ORDER BY f.fecha_hora DESC
      LIMIT 20
    `;
    return c.json(fichajes);
  }

  // Todos (para dashboard)
  const fichajes = await sql`
    SELECT f.*, e.nombre, e.apellido, e.celular
    FROM fichajes f
    JOIN empleados e ON f.empleado_id = e.id
    ORDER BY f.fecha_hora DESC
    LIMIT 2000
  `;
  return c.json(fichajes);
});

// ══════════════════════════════════════════════════
//  HORARIOS
// ══════════════════════════════════════════════════

// Obtener todos los horarios (para dashboard)
app.get("/api/horarios", async (c) => {
  const emp_id = c.req.query("empleado_id");
  const fecha = c.req.query("fecha");

  if (emp_id && fecha) {
    // Horario de un empleado en una fecha (para miniapp)
    const [horario] = await sql`
      SELECT * FROM horarios
      WHERE empleado_id = ${emp_id}
        AND fecha = ${fecha}::date
    `;
    if (!horario) return c.json(null, 200);
    return c.json(horario);
  }

  // Todos los horarios
  const horarios = await sql`
    SELECT h.*, e.nombre, e.apellido
    FROM horarios h
    JOIN empleados e ON h.empleado_id = e.id
    ORDER BY h.fecha DESC, e.apellido, e.nombre
  `;
  return c.json(horarios);
});

// Crear o actualizar horario de un empleado en una fecha
app.post("/api/horarios", async (c) => {
  const { empleado_id, fecha, entrada, salida, entrada2, salida2 } = await c.req.json();

  if (!empleado_id || !fecha) {
    return c.json({ error: "empleado_id y fecha son requeridos" }, 400);
  }

  const toTime = (v) => (v && v.trim() ? v.trim() : null);

  const [horario] = await sql`
    INSERT INTO horarios (empleado_id, fecha, entrada, salida, entrada2, salida2)
    VALUES (
      ${empleado_id}, ${fecha}::date,
      ${toTime(entrada)}, ${toTime(salida)},
      ${toTime(entrada2)}, ${toTime(salida2)}
    )
    ON CONFLICT (empleado_id, fecha)
    DO UPDATE SET
      entrada  = EXCLUDED.entrada,
      salida   = EXCLUDED.salida,
      entrada2 = EXCLUDED.entrada2,
      salida2  = EXCLUDED.salida2
    RETURNING *
  `;
  return c.json(horario, 200);
});

// Batch import: recibe { horarios: { empleado_id: { fecha: { entrada, salida, ... } } } }
app.post("/api/horarios/batch", async (c) => {
  const { horarios } = await c.req.json();
  let count = 0;
  const toTime = (v) => (v && v.trim() ? v.trim() : null);

  for (const [empId, fechas] of Object.entries(horarios)) {
    for (const [fecha, h] of Object.entries(fechas)) {
      try {
        await sql`
          INSERT INTO horarios (empleado_id, fecha, entrada, salida, entrada2, salida2)
          VALUES (
            ${empId}, ${fecha}::date,
            ${toTime(h.entrada)}, ${toTime(h.salida)},
            ${toTime(h.entrada2)}, ${toTime(h.salida2)}
          )
          ON CONFLICT (empleado_id, fecha)
          DO UPDATE SET
            entrada  = EXCLUDED.entrada,
            salida   = EXCLUDED.salida,
            entrada2 = EXCLUDED.entrada2,
            salida2  = EXCLUDED.salida2
        `;
        count++;
      } catch (e) {
        console.error(`Error en batch empId=${empId} fecha=${fecha}:`, e.message);
      }
    }
  }
  return c.json({ ok: true, insertados: count });
});

// Eliminar horario de un empleado en una fecha
app.delete("/api/horarios", async (c) => {
  const { empleado_id, fecha } = await c.req.json();
  await sql`
    DELETE FROM horarios
    WHERE empleado_id = ${empleado_id} AND fecha = ${fecha}::date
  `;
  return c.json({ ok: true });
});

// ══════════════════════════════════════════════════
//  MÉTRICAS (para dashboard de KPIs)
// ══════════════════════════════════════════════════

app.get("/api/metricas/hoy", async (c) => {
  const hoy = new Date().toISOString().split("T")[0];

  const [totales] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE tipo = 'entrada') AS entradas,
      COUNT(*) FILTER (WHERE tipo = 'salida')  AS salidas,
      COUNT(DISTINCT empleado_id) AS empleados_hoy
    FROM fichajes
    WHERE fecha_hora::date = ${hoy}::date
  `;

  // Dentro: entrada sin salida
  const dentro = await sql`
    SELECT DISTINCT f.empleado_id, e.nombre, e.apellido
    FROM fichajes f
    JOIN empleados e ON f.empleado_id = e.id
    WHERE f.fecha_hora::date = ${hoy}::date
      AND f.tipo IN ('entrada', 'entrada2')
      AND NOT EXISTS (
        SELECT 1 FROM fichajes f2
        WHERE f2.empleado_id = f.empleado_id
          AND f2.fecha_hora::date = ${hoy}::date
          AND f2.tipo = CASE f.tipo WHEN 'entrada' THEN 'salida' ELSE 'salida2' END
      )
  `;

  return c.json({
    ...totales,
    dentro: dentro.length,
    empleados_dentro: dentro
  });
});

// Métricas de llegadas tarde en un rango
app.get("/api/metricas/tardes", async (c) => {
  const empId = c.req.query("empleado_id");
  const desde = c.req.query("desde") || new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const hasta = c.req.query("hasta") || new Date().toISOString().split("T")[0];
  const toleranciaMin = parseInt(c.req.query("tolerancia") || "10");

  const tardes = await sql`
    SELECT
      e.id, e.nombre, e.apellido,
      f.fecha_hora,
      h.entrada AS hora_programada,
      EXTRACT(EPOCH FROM (f.fecha_hora - (f.fecha_hora::date + h.entrada::interval)))/60 AS minutos_tarde
    FROM fichajes f
    JOIN empleados e ON f.empleado_id = e.id
    JOIN horarios h ON h.empleado_id = f.empleado_id AND h.fecha = f.fecha_hora::date
    WHERE f.tipo = 'entrada'
      AND f.fecha_hora::date BETWEEN ${desde}::date AND ${hasta}::date
      AND ${empId ? sql`f.empleado_id = ${empId} AND` : sql``} TRUE
      AND EXTRACT(EPOCH FROM (f.fecha_hora - (f.fecha_hora::date + h.entrada::interval)))/60 > ${toleranciaMin}
    ORDER BY f.fecha_hora DESC
  `;

  return c.json(tardes);
});

// ══════════════════════════════════════════════════
//  HEALTHCHECK
// ══════════════════════════════════════════════════
app.get("/", (c) => c.json({
  app: "Bar Ideal API",
  version: "2.0",
  status: "ok",
  endpoints: [
    "POST /api/empleados",
    "GET  /api/empleados/list",
    "GET  /api/empleados/:id",
    "POST /api/fichajes",
    "GET  /api/fichajes",
    "GET  /api/horarios",
    "POST /api/horarios",
    "POST /api/horarios/batch",
    "DELETE /api/horarios",
    "GET  /api/metricas/hoy",
    "GET  /api/metricas/tardes",
  ]
}));

// ══════════════════════════════════════════════════
//  ARRANQUE
// ══════════════════════════════════════════════════
await migrate();
const port = parseInt(Bun.env.PORT ?? "3000");
console.log(`🍺 Bar Ideal API corriendo en puerto ${port}`);
Bun.serve({ port, fetch: app.fetch });
