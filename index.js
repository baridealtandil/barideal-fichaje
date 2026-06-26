/**
 * API Bar Ideal — Bun + Hono v2.1
 * Nuevos endpoints: planilla_empleados, horarios, matching
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { sql } from "bun";

const app = new Hono();
app.use("/*", cors());

// ══════════════════════════════════════════════════
//  MIGRACIÓN
// ══════════════════════════════════════════════════
async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS empleados (
      id         SERIAL PRIMARY KEY,
      nombre     TEXT NOT NULL,
      apellido   TEXT NOT NULL,
      celular    TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS fichajes (
      id          SERIAL PRIMARY KEY,
      empleado_id INTEGER NOT NULL REFERENCES empleados(id),
      tipo        TEXT NOT NULL CHECK (tipo IN ('entrada','salida','entrada2','salida2')),
      lat         FLOAT8,
      lng         FLOAT8,
      fecha_hora  TIMESTAMP DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS planilla_empleados (
      id          SERIAL PRIMARY KEY,
      nombre      TEXT NOT NULL,
      apellido    TEXT NOT NULL,
      rol         TEXT,
      empleado_id INTEGER REFERENCES empleados(id),
      created_at  TIMESTAMP DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS horarios (
      id               SERIAL PRIMARY KEY,
      planilla_emp_id  INTEGER REFERENCES planilla_empleados(id),
      fecha            DATE NOT NULL,
      entrada1         TIME,
      salida1          TIME,
      entrada2         TIME,
      salida2          TIME,
      estado           TEXT DEFAULT 'normal' CHECK (estado IN ('normal','franco','ausente')),
      UNIQUE(planilla_emp_id, fecha)
    )`;

  await sql`CREATE INDEX IF NOT EXISTS idx_fichajes_empleado ON fichajes(empleado_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_fichajes_fecha ON fichajes(fecha_hora)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_horarios_fecha ON horarios(fecha)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_planilla_empleado ON planilla_empleados(empleado_id)`;

  console.log("✅ Migración completada");
}

// ══════════════════════════════════════════════════
//  HELPERS DE MATCHING
// ══════════════════════════════════════════════════
function normalizar(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

function palabras(str) {
  return normalizar(str).split(/\s+/).filter(Boolean);
}

function matchScore(planillaNombre, planillaApellido, regNombre, regApellido) {
  const apNorm1 = normalizar(planillaApellido);
  const apNorm2 = normalizar(regApellido);

  // Apellido debe coincidir exactamente
  if (apNorm1 !== apNorm2) return 0;

  // Comparar palabras del nombre
  const palabras1 = palabras(planillaNombre);
  const palabras2 = palabras(regNombre);

  let coincidencias = 0;
  for (const p of palabras2) {
    if (palabras1.some(q => q === p || q.startsWith(p) || p.startsWith(q))) {
      coincidencias++;
    }
  }

  // Si al menos una palabra del nombre coincide → match
  return coincidencias > 0 ? (coincidencias / Math.max(palabras1.length, palabras2.length)) : 0;
}

// ══════════════════════════════════════════════════
//  EMPLEADOS
// ══════════════════════════════════════════════════
app.post("/api/empleados", async (c) => {
  const { nombre, apellido, celular } = await c.req.json();
  if (!nombre || !apellido || !celular)
    return c.json({ error: "nombre, apellido y celular son requeridos" }, 400);

  const existing = await sql`SELECT * FROM empleados WHERE celular = ${celular} LIMIT 1`;
  if (existing.length > 0) return c.json(existing[0], 200);

  const [empleado] = await sql`
    INSERT INTO empleados (nombre, apellido, celular)
    VALUES (${nombre.trim()}, ${apellido.trim()}, ${celular.trim()})
    RETURNING *`;

  return c.json(empleado, 201);
});

app.get("/api/empleados/list", async (c) => {
  const empleados = await sql`SELECT * FROM empleados ORDER BY apellido, nombre ASC`;
  return c.json(empleados);
});

app.get("/api/empleados/:id", async (c) => {
  const id = c.req.param("id");
  const [empleado] = await sql`SELECT * FROM empleados WHERE id = ${id}`;
  if (!empleado) return c.json({ error: "Empleado no encontrado" }, 404);
  return c.json(empleado);
});

// ══════════════════════════════════════════════════
//  MATCHING
// ══════════════════════════════════════════════════
app.post("/api/matching/buscar", async (c) => {
  const { nombre, apellido } = await c.req.json();
  if (!nombre || !apellido) return c.json({ matches: [] });

  // Buscar en planilla_empleados que no tengan empleado_id aún
  const candidatos = await sql`
    SELECT * FROM planilla_empleados
    WHERE empleado_id IS NULL
    ORDER BY apellido, nombre`;

  const resultados = [];
  for (const c_ of candidatos) {
    const score = matchScore(c_.nombre, c_.apellido, nombre, apellido);
    if (score > 0) {
      resultados.push({ ...c_, score });
    }
  }

  // Ordenar por score descendente
  resultados.sort((a, b) => b.score - a.score);

  return c.json({ matches: resultados.slice(0, 3) });
});

app.post("/api/matching/confirmar", async (c) => {
  const { planilla_emp_id, empleado_id } = await c.req.json();
  if (!planilla_emp_id || !empleado_id)
    return c.json({ error: "planilla_emp_id y empleado_id son requeridos" }, 400);

  await sql`
    UPDATE planilla_empleados
    SET empleado_id = ${empleado_id}
    WHERE id = ${planilla_emp_id}`;

  return c.json({ ok: true });
});

// ══════════════════════════════════════════════════
//  FICHAJES
// ══════════════════════════════════════════════════
app.post("/api/fichajes", async (c) => {
  const { empleado_id, tipo, lat, lng } = await c.req.json();
  const tiposValidos = ["entrada", "salida", "entrada2", "salida2"];
  if (!tiposValidos.includes(tipo))
    return c.json({ error: "tipo inválido" }, 400);

  const [emp] = await sql`SELECT id FROM empleados WHERE id = ${empleado_id}`;
  if (!emp) return c.json({ error: "Empleado no encontrado" }, 404);

  const hoy = new Date().toISOString().split("T")[0];
  const dup = await sql`
    SELECT id FROM fichajes
    WHERE empleado_id = ${empleado_id} AND tipo = ${tipo} AND fecha_hora::date = ${hoy}::date
    LIMIT 1`;
  if (dup.length > 0)
    return c.json({ error: `Ya existe un fichaje de tipo '${tipo}' hoy`, existing: dup[0] }, 409);

  const [fichaje] = await sql`
    INSERT INTO fichajes (empleado_id, tipo, lat, lng, fecha_hora)
    VALUES (${empleado_id}, ${tipo}, ${lat}, ${lng}, NOW())
    RETURNING *`;
  return c.json(fichaje, 201);
});

app.get("/api/fichajes", async (c) => {
  const emp_id = c.req.query("empleado_id");
  const fecha  = c.req.query("fecha");

  if (emp_id && fecha) {
    const fichajes = await sql`
      SELECT f.*, e.nombre, e.apellido, e.celular
      FROM fichajes f JOIN empleados e ON f.empleado_id = e.id
      WHERE f.empleado_id = ${emp_id} AND f.fecha_hora::date = ${fecha}::date
      ORDER BY f.fecha_hora ASC`;
    return c.json(fichajes);
  }
  if (emp_id) {
    const fichajes = await sql`
      SELECT f.*, e.nombre, e.apellido, e.celular
      FROM fichajes f JOIN empleados e ON f.empleado_id = e.id
      WHERE f.empleado_id = ${emp_id}
      ORDER BY f.fecha_hora DESC LIMIT 20`;
    return c.json(fichajes);
  }
  const fichajes = await sql`
    SELECT f.*, e.nombre, e.apellido, e.celular
    FROM fichajes f JOIN empleados e ON f.empleado_id = e.id
    ORDER BY f.fecha_hora DESC LIMIT 2000`;
  return c.json(fichajes);
});

// ══════════════════════════════════════════════════
//  PLANILLA EMPLEADOS
// ══════════════════════════════════════════════════
app.get("/api/planilla/empleados", async (c) => {
  const empleados = await sql`
    SELECT pe.*, e.celular, e.nombre as emp_nombre, e.apellido as emp_apellido
    FROM planilla_empleados pe
    LEFT JOIN empleados e ON pe.empleado_id = e.id
    ORDER BY pe.rol, pe.apellido, pe.nombre`;
  return c.json(empleados);
});

// Importar lista de empleados desde planilla (sin horarios)
app.post("/api/planilla/empleados/batch", async (c) => {
  const { empleados } = await c.req.json();
  let insertados = 0, existentes = 0;

  for (const emp of empleados) {
    const { nombre, apellido, rol } = emp;
    if (!nombre || !apellido) continue;

    const existing = await sql`
      SELECT id FROM planilla_empleados
      WHERE LOWER(apellido) = LOWER(${apellido})
        AND LOWER(nombre) = LOWER(${nombre})
      LIMIT 1`;

    if (existing.length > 0) { existentes++; continue; }

    await sql`
      INSERT INTO planilla_empleados (nombre, apellido, rol)
      VALUES (${nombre.trim()}, ${apellido.trim()}, ${rol || null})`;
    insertados++;
  }

  return c.json({ ok: true, insertados, existentes });
});

// Vincular manualmente desde dashboard
app.post("/api/planilla/empleados/vincular", async (c) => {
  const { planilla_emp_id, empleado_id } = await c.req.json();
  await sql`UPDATE planilla_empleados SET empleado_id = ${empleado_id} WHERE id = ${planilla_emp_id}`;
  return c.json({ ok: true });
});

// ══════════════════════════════════════════════════
//  HORARIOS
// ══════════════════════════════════════════════════
app.get("/api/horarios", async (c) => {
  const semana = c.req.query("semana"); // YYYY-MM-DD (lunes de la semana)
  const emp_id = c.req.query("empleado_id");

  if (semana) {
    const horarios = await sql`
      SELECT h.*, pe.nombre, pe.apellido, pe.rol, pe.empleado_id as emp_id_real
      FROM horarios h
      JOIN planilla_empleados pe ON h.planilla_emp_id = pe.id
      WHERE h.fecha >= ${semana}::date AND h.fecha < (${semana}::date + INTERVAL '7 days')
      ORDER BY pe.rol, pe.apellido, pe.nombre, h.fecha`;
    return c.json(horarios);
  }

  if (emp_id) {
    // Horarios del empleado para hoy
    const hoy = new Date().toISOString().split("T")[0];
    const horarios = await sql`
      SELECT h.*
      FROM horarios h
      JOIN planilla_empleados pe ON h.planilla_emp_id = pe.id
      WHERE pe.empleado_id = ${emp_id} AND h.fecha = ${hoy}::date
      LIMIT 1`;
    return c.json(horarios[0] || null);
  }

  return c.json({ error: "Parámetro semana o empleado_id requerido" }, 400);
});

// Guardar/actualizar horario de un empleado en una fecha
app.post("/api/horarios", async (c) => {
  const { planilla_emp_id, fecha, entrada1, salida1, entrada2, salida2, estado } = await c.req.json();
  if (!planilla_emp_id || !fecha)
    return c.json({ error: "planilla_emp_id y fecha son requeridos" }, 400);

  const t = v => (v && v.trim()) ? v.trim() : null;

  const [horario] = await sql`
    INSERT INTO horarios (planilla_emp_id, fecha, entrada1, salida1, entrada2, salida2, estado)
    VALUES (${planilla_emp_id}, ${fecha}::date, ${t(entrada1)}, ${t(salida1)}, ${t(entrada2)}, ${t(salida2)}, ${estado || 'normal'})
    ON CONFLICT (planilla_emp_id, fecha) DO UPDATE SET
      entrada1 = EXCLUDED.entrada1, salida1 = EXCLUDED.salida1,
      entrada2 = EXCLUDED.entrada2, salida2 = EXCLUDED.salida2,
      estado   = EXCLUDED.estado
    RETURNING *`;
  return c.json(horario);
});

// Importar semana completa desde Excel
app.post("/api/horarios/batch", async (c) => {
  const { semana, horarios } = await c.req.json();
  // horarios: [{ planilla_emp_id, fecha, entrada1, salida1, entrada2, salida2, estado }]
  let count = 0;
  const t = v => (v && String(v).trim()) ? String(v).trim() : null;

  for (const h of horarios) {
    try {
      await sql`
        INSERT INTO horarios (planilla_emp_id, fecha, entrada1, salida1, entrada2, salida2, estado)
        VALUES (${h.planilla_emp_id}, ${h.fecha}::date, ${t(h.entrada1)}, ${t(h.salida1)}, ${t(h.entrada2)}, ${t(h.salida2)}, ${h.estado || 'normal'})
        ON CONFLICT (planilla_emp_id, fecha) DO UPDATE SET
          entrada1 = EXCLUDED.entrada1, salida1 = EXCLUDED.salida1,
          entrada2 = EXCLUDED.entrada2, salida2 = EXCLUDED.salida2,
          estado   = EXCLUDED.estado`;
      count++;
    } catch(e) {
      console.error('Error batch horario:', e.message);
    }
  }
  return c.json({ ok: true, guardados: count });
});

// ══════════════════════════════════════════════════
//  MÉTRICAS
// ══════════════════════════════════════════════════
app.get("/api/metricas/hoy", async (c) => {
  const hoy = new Date().toISOString().split("T")[0];
  const [totales] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE tipo = 'entrada') AS entradas,
      COUNT(*) FILTER (WHERE tipo = 'salida')  AS salidas,
      COUNT(DISTINCT empleado_id) AS empleados_hoy
    FROM fichajes WHERE fecha_hora::date = ${hoy}::date`;

  const dentro = await sql`
    SELECT DISTINCT f.empleado_id, e.nombre, e.apellido
    FROM fichajes f JOIN empleados e ON f.empleado_id = e.id
    WHERE f.fecha_hora::date = ${hoy}::date
      AND f.tipo IN ('entrada','entrada2')
      AND NOT EXISTS (
        SELECT 1 FROM fichajes f2
        WHERE f2.empleado_id = f.empleado_id
          AND f2.fecha_hora::date = ${hoy}::date
          AND f2.tipo = CASE f.tipo WHEN 'entrada' THEN 'salida' ELSE 'salida2' END
          AND f2.fecha_hora > f.fecha_hora
      )`;

  return c.json({ ...totales, dentro: dentro.length, empleados_dentro: dentro });
});

// ══════════════════════════════════════════════════
//  HEALTHCHECK
// ══════════════════════════════════════════════════
app.get("/", (c) => c.json({ app: "Bar Ideal API", version: "2.1", status: "ok" }));

await migrate();
const port = parseInt(Bun.env.PORT ?? "3000");
console.log(`🍺 Bar Ideal API v2.1 corriendo en puerto ${port}`);
Bun.serve({ port, fetch: app.fetch });
