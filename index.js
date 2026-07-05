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

  // Migración: renombrar columnas entrada→entrada1, salida→salida1 si existen con nombre viejo
  try {
    await sql`ALTER TABLE horarios RENAME COLUMN entrada TO entrada1`;
    console.log("✅ Columna entrada renombrada a entrada1");
  } catch(e) { /* ya existe con el nombre correcto */ }
  try {
    await sql`ALTER TABLE horarios RENAME COLUMN salida TO salida1`;
    console.log("✅ Columna salida renombrada a salida1");
  } catch(e) { /* ya existe con el nombre correcto */ }

  // Migración: agregar columna empleado_id a horarios si no existe (versión vieja)
  try {
    await sql`ALTER TABLE horarios DROP COLUMN IF EXISTS empleado_id`;
  } catch(e) {}

  // Agregar columna manual a fichajes si no existe
  await sql`ALTER TABLE fichajes ADD COLUMN IF NOT EXISTS manual BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE fichajes ADD COLUMN IF NOT EXISTS autorizado BOOLEAN DEFAULT FALSE`;
await sql`ALTER TABLE fichajes ADD COLUMN IF NOT EXISTS secuencia_irregular BOOLEAN DEFAULT FALSE`;

// PIN de seguridad para encargados (permite autorizar ediciones de fichajes) y trazabilidad de ediciones
await sql`ALTER TABLE planilla_empleados ADD COLUMN IF NOT EXISTS pin TEXT`;
await sql`ALTER TABLE empleados ADD COLUMN IF NOT EXISTS pin TEXT`;
await sql`UPDATE planilla_empleados SET pin = '1234' WHERE LOWER(nombre) = 'almendra' AND pin IS NULL`;
await sql`UPDATE planilla_empleados SET pin = '0000' WHERE LOWER(nombre) = 'lucas' AND pin IS NULL`;
await sql`UPDATE empleados SET pin = '1234' WHERE LOWER(nombre) = 'almendra' AND pin IS NULL`;
await sql`UPDATE empleados SET pin = '0000' WHERE LOWER(nombre) = 'lucas' AND pin IS NULL`;
await sql`ALTER TABLE fichajes ADD COLUMN IF NOT EXISTS editado_por TEXT`;

  // Tabla push tokens para notificaciones
  await sql`
    CREATE TABLE IF NOT EXISTS push_tokens (
      id          SERIAL PRIMARY KEY,
      empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
      subscription TEXT NOT NULL,
      updated_at  TIMESTAMP DEFAULT NOW(),
      UNIQUE(empleado_id)
    )`;

  // Tabla para evitar notificaciones duplicadas
  await sql`
    CREATE TABLE IF NOT EXISTS notif_enviadas (
      id          SERIAL PRIMARY KEY,
      empleado_id INTEGER NOT NULL,
      tipo        TEXT NOT NULL,
      fecha       DATE NOT NULL,
      turno       TEXT NOT NULL,
      enviada_at  TIMESTAMP DEFAULT NOW(),
      UNIQUE(empleado_id, tipo, fecha, turno)
    )`;

  console.log("\u2705 Migraci\u00f3n completada");
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
  const empleados = await sql`SELECT id, nombre, apellido, celular, created_at FROM empleados ORDER BY apellido, nombre ASC`;
  return c.json(empleados);
});

app.get("/api/empleados/:id", async (c) => {
  const id = c.req.param("id");
      const [empleado] = await sql`SELECT id, nombre, apellido, celular, created_at FROM empleados WHERE id = ${id}`;
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

  // Determinar el día laboral activo: si hay una entrada abierta de ayer, ese es el día activo
  const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1000 - 5 * 60 * 60 * 1000); // UTC-3, jornada laboral divide a las 05:00
  const hoy = ahoraAR.toISOString().split("T")[0];
  const ayerD = new Date(ahoraAR); ayerD.setDate(ayerD.getDate() - 1);
  const ayer = ayerD.toISOString().split("T")[0];

  // Ver si hay turno abierto de ayer (entrada sin su salida correspondiente)
  const entradasAyer = await sql`
    SELECT tipo FROM fichajes
    WHERE empleado_id = ${empleado_id}
      AND ((fecha_hora - INTERVAL '5 hours') AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = ${ayer}::date
    ORDER BY fecha_hora ASC`;

  const tiposAyer = entradasAyer.map(f => f.tipo);
  const turnoAbiertoAyer = (
    (tiposAyer.includes('entrada')  && !tiposAyer.includes('salida')) ||
    (tiposAyer.includes('entrada2') && !tiposAyer.includes('salida2'))
  ) ? [true] : [];

  const fechaLaboral = turnoAbiertoAyer.length > 0 ? ayer : hoy;

// Detectar si la secuencia esta rota, SIN bloquear el registro (el fichaje siempre se guarda)
    const fichajesActivos = await sql`
      SELECT tipo FROM fichajes
      WHERE empleado_id = ${empleado_id} AND ((fecha_hora - INTERVAL '5 hours') AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = ${fechaLaboral}::date
      ORDER BY fecha_hora ASC`;

    const tipos = fichajesActivos.map(f => f.tipo);
    const tieneEntrada = tipos.includes('entrada');
    const tieneSalida = tipos.includes('salida');
    const tieneEntrada2 = tipos.includes('entrada2');
    const tieneSalida2 = tipos.includes('salida2');

    // Secuencia esperada: entrada -> salida -> entrada2 -> salida2
    let secuenciaIrregular = false;
    if (tipo === 'salida' && !tieneEntrada) secuenciaIrregular = true;
    if (tipo === 'entrada2' && !tieneSalida) secuenciaIrregular = true;
    if (tipo === 'salida2' && !tieneEntrada2) secuenciaIrregular = true;
    if (tipo === 'entrada' && tieneEntrada && !tieneSalida) secuenciaIrregular = true;
  const [fichaje] = await sql`
      INSERT INTO fichajes (empleado_id, tipo, lat, lng, fecha_hora, secuencia_irregular)
      VALUES (${empleado_id}, ${tipo}, ${lat}, ${lng}, NOW(), ${secuenciaIrregular})
      RETURNING *`;
    return c.json(fichaje, 201);
});

// Cierre manual por el empleado con hora real informada
app.post("/api/fichajes/cierre-manual", async (c) => {
  try {
    const { empleado_id, tipo, lat, lng, fecha_hora, manual } = await c.req.json();
    if (!empleado_id || !tipo || !fecha_hora)
      return c.json({ error: "Faltan datos" }, 400);

const tiposValidos = ["entrada", "salida", "entrada2", "salida2"];
    if (!tiposValidos.includes(tipo))
      return c.json({ error: "tipo invalido para cierre manual" }, 400);

    if (tipo === "salida" || tipo === "salida2") {
      // Flujo de autoservicio del empleado: verificar que existe la entrada correspondiente
      const tipoEntrada = tipo === 'salida' ? 'entrada' : 'entrada2';
      const entrada = await sql`
        SELECT id, fecha_hora FROM fichajes
        WHERE empleado_id = ${empleado_id} AND tipo = ${tipoEntrada}
        ORDER BY fecha_hora DESC LIMIT 1`;

      if (!entrada.length)
        return c.json({ error: "No se encontro la entrada correspondiente" }, 404);

      // Verificar que no haya ya una salida (idempotente: si existe, la devuelve)
      const yaExiste = await sql`
        SELECT id FROM fichajes
        WHERE empleado_id = ${empleado_id} AND tipo = ${tipo}
        AND fecha_hora > ${entrada[0].fecha_hora}
        LIMIT 1`;

      if (yaExiste.length) {
        const [existente] = await sql`SELECT * FROM fichajes WHERE id = ${yaExiste[0].id}`;
        return c.json(existente, 200);
      }
    } else {
      // Carga manual desde el dashboard del encargado (entrada/entrada2 faltante): idempotente por fecha_hora exacta
      const yaExiste = await sql`
        SELECT id FROM fichajes
        WHERE empleado_id = ${empleado_id} AND tipo = ${tipo} AND fecha_hora = ${fecha_hora}
        LIMIT 1`;

      if (yaExiste.length) {
        const [existente] = await sql`SELECT * FROM fichajes WHERE id = ${yaExiste[0].id}`;
        return c.json(existente, 200);
      }
    }

    const [fichaje] = await sql`
      INSERT INTO fichajes (empleado_id, tipo, lat, lng, fecha_hora, manual)
      VALUES (${empleado_id}, ${tipo}, ${lat || 0}, ${lng || 0}, ${fecha_hora}, TRUE)
      RETURNING *`;

    console.log(`✏️ Cierre manual: empleado ${empleado_id} — ${tipo} — ${fecha_hora}`);
    return c.json(fichaje, 201);
  } catch(e) {
    console.error("Error cierre-manual:", e.message);
    return c.json({ error: e.message }, 500);
  }
});

// Forzar cierre de turno abierto (desde dashboard del encargado)
app.post("/api/fichajes/forzar-cierre", async (c) => {
  try {
    const { empleado_id } = await c.req.json();
    if (!empleado_id) return c.json({ error: "empleado_id requerido" }, 400);

    const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1000 - 5 * 60 * 60 * 1000); // jornada laboral divide a las 05:00
    const hoy = ahoraAR.toISOString().split("T")[0];
    const ayerD = new Date(ahoraAR); ayerD.setDate(ayerD.getDate() - 1);
    const ayer = ayerD.toISOString().split("T")[0];

    // Buscar en hoy y ayer
    const fechas = [hoy, ayer];
    let cerrados = 0;

    for (const fecha of fechas) {
      const fichajes = await sql`
        SELECT tipo, lat, lng FROM fichajes
        WHERE empleado_id = ${empleado_id} AND ((fecha_hora - INTERVAL '5 hours') AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = ${fecha}::date
        ORDER BY fecha_hora ASC`;

      const tipos = fichajes.map(f => f.tipo);
      const lastFichaje = fichajes[fichajes.length - 1];
      const lat = lastFichaje?.lat || 0;
      const lng = lastFichaje?.lng || 0;

      // Cerrar entrada sin salida
      if (tipos.includes('entrada') && !tipos.includes('salida')) {
        await sql`INSERT INTO fichajes (empleado_id, tipo, lat, lng, fecha_hora)
          VALUES (${empleado_id}, 'salida', ${lat}, ${lng}, NOW())`;
        cerrados++;
      }
      // Cerrar entrada2 sin salida2
      if (tipos.includes('entrada2') && !tipos.includes('salida2')) {
        await sql`INSERT INTO fichajes (empleado_id, tipo, lat, lng, fecha_hora)
          VALUES (${empleado_id}, 'salida2', ${lat}, ${lng}, NOW())`;
        cerrados++;
      }
    }

    if (cerrados === 0)
      return c.json({ ok: true, mensaje: "No había turnos abiertos" });

    return c.json({ ok: true, cerrados, mensaje: `${cerrados} turno(s) cerrado(s)` });
  } catch(e) {
    console.error("Error forzar-cierre:", e.message);
    return c.json({ error: e.message }, 500);
  }
});

app.get("/api/fichajes", async (c) => {
  const emp_id = c.req.query("empleado_id") || c.req.query("emp_id");
  const fecha  = c.req.query("fecha");

  if (emp_id && fecha) {
    const fichajes = await sql`
      SELECT f.*, e.nombre, e.apellido, e.celular
      FROM fichajes f JOIN empleados e ON f.empleado_id = e.id
      WHERE f.empleado_id = ${emp_id} AND ((f.fecha_hora - INTERVAL '5 hours') AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = ${fecha}::date
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
        SELECT pe.id, pe.nombre, pe.apellido, pe.rol, pe.empleado_id, pe.created_at, e.celular, e.nombre as emp_nombre, e.apellido as emp_apellido
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
  try {
    const body = await c.req.json();
    const { planilla_emp_id, fecha } = body;
    if (!planilla_emp_id || !fecha)
      return c.json({ error: "planilla_emp_id y fecha son requeridos" }, 400);

    const t = v => (v && String(v).trim()) ? String(v).trim() : null;
    const e1 = t(body.entrada1);
    const s1 = t(body.salida1);
    const e2 = t(body.entrada2);
    const s2 = t(body.salida2);
    const est = body.estado || 'normal';

    // Intentar UPDATE primero
    const existing = await sql`SELECT id FROM horarios WHERE planilla_emp_id = ${planilla_emp_id} AND fecha = ${fecha}::date LIMIT 1`;

    let horario;
    if (existing.length > 0) {
      [horario] = await sql`
        UPDATE horarios SET entrada1=${e1}, salida1=${s1}, entrada2=${e2}, salida2=${s2}, estado=${est}
        WHERE planilla_emp_id=${planilla_emp_id} AND fecha=${fecha}::date
        RETURNING *`;
    } else {
      [horario] = await sql`
        INSERT INTO horarios (planilla_emp_id, fecha, entrada1, salida1, entrada2, salida2, estado)
        VALUES (${planilla_emp_id}, ${fecha}::date, ${e1}, ${s1}, ${e2}, ${s2}, ${est})
        RETURNING *`;
    }
    return c.json(horario);
  } catch(e) {
    console.error("Error POST /api/horarios:", e.message);
    return c.json({ error: e.message }, 500);
  }
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
  const ahoraAR2 = new Date(Date.now() - 3 * 60 * 60 * 1000 - 5 * 60 * 60 * 1000); // jornada laboral divide a las 05:00
  const hoy = ahoraAR2.toISOString().split("T")[0];
  const [totales] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE tipo = 'entrada') AS entradas,
      COUNT(*) FILTER (WHERE tipo = 'salida')  AS salidas,
      COUNT(DISTINCT empleado_id) AS empleados_hoy
    FROM fichajes WHERE ((fecha_hora - INTERVAL '5 hours') AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = ${hoy}::date`;

  const dentro = await sql`
    SELECT DISTINCT f.empleado_id, e.nombre, e.apellido
    FROM fichajes f JOIN empleados e ON f.empleado_id = e.id
    WHERE ((f.fecha_hora - INTERVAL '5 hours') AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = ${hoy}::date
      AND f.tipo IN ('entrada','entrada2')
      AND NOT EXISTS (
        SELECT 1 FROM fichajes f2
        WHERE f2.empleado_id = f.empleado_id
          AND ((f2.fecha_hora - INTERVAL '5 hours') AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = ${hoy}::date
          AND f2.tipo = CASE f.tipo WHEN 'entrada' THEN 'salida' ELSE 'salida2' END
          AND f2.fecha_hora > f.fecha_hora
      )`;

  return c.json({ ...totales, dentro: dentro.length, empleados_dentro: dentro });
});

// ══════════════════════════════════════════════════
//  PUSH NOTIFICATIONS
// ══════════════════════════════════════════════════

// Guardar/actualizar suscripción push del empleado
app.post("/api/push/token", async (c) => {
  try {
    const { empleado_id, subscription } = await c.req.json();
    if (!empleado_id || !subscription) return c.json({ error: "Faltan datos" }, 400);
    const subStr = JSON.stringify(subscription);
    await sql`
      INSERT INTO push_tokens (empleado_id, subscription, updated_at)
      VALUES (${empleado_id}, ${subStr}, NOW())
      ON CONFLICT (empleado_id) DO UPDATE
        SET subscription = EXCLUDED.subscription, updated_at = NOW()`;
    return c.json({ ok: true });
  } catch(e) {
    console.error("Error guardando push token:", e.message);
    return c.json({ error: e.message }, 500);
  }
});

// ── CRON DE NOTIFICACIONES ──
// Genera claves VAPID al iniciar
import webpush from "web-push";

const VAPID_PUBLIC_KEY  = "BBw7l6n5jktroTSq8z5xAel5qH4gK5y4n5G4KCUFmmuXQ8jNKAy5gGkn5nuIU_ecETpJo5IfUcPyEI_F96E6cHM";
const VAPID_PRIVATE_KEY = Bun.env.VAPID_PRIVATE_KEY || "";

if (VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails("mailto:barideal@ideal.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const TOLERANCIA_MINUTOS = 10; // minutos tras los cuales se notifica

async function enviarPush(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch(e) {
    // Suscripción inválida / expirada → limpiar
    if (e.statusCode === 410 || e.statusCode === 404) {
      try {
        const subStr = JSON.stringify(subscription);
        await sql`DELETE FROM push_tokens WHERE subscription = ${subStr}`;
      } catch {}
    }
    console.warn("Error enviando push:", e.message);
    return false;
  }
}

async function cronNotificaciones() {
  if (!VAPID_PRIVATE_KEY) return; // sin configurar, saltar

  // Zona horaria Argentina (UTC-3)
  const ahora = new Date();
  const ahoraAR = new Date(ahora.getTime() - 3 * 60 * 60 * 1000);
  const horaActualMin = ahoraAR.getUTCHours() * 60 + ahoraAR.getUTCMinutes();
  const fechaHoy = new Date(ahora.getTime() - 8 * 60 * 60 * 1000).toISOString().split("T")[0]; // jornada laboral divide a las 05:00

  try {
    // Traer todos los horarios de hoy con empleados vinculados y sus tokens
    const horarios = await sql`
      SELECT
        h.planilla_emp_id, h.entrada1, h.salida1, h.entrada2, h.salida2, h.estado,
        pe.empleado_id,
        e.nombre, e.apellido,
        pt.subscription
      FROM horarios h
      JOIN planilla_empleados pe ON h.planilla_emp_id = pe.id
      JOIN empleados e ON pe.empleado_id = e.id
      JOIN push_tokens pt ON pt.empleado_id = pe.empleado_id
      WHERE h.fecha = ${fechaHoy}::date
        AND h.estado = 'normal'
        AND pe.empleado_id IS NOT NULL`;

    if (!horarios.length) return;

    // Fichajes de hoy
    const fichajes = await sql`
      SELECT empleado_id, tipo FROM fichajes
      WHERE ((fecha_hora - INTERVAL '5 hours') AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = ${fechaHoy}::date`;

    const fichajesPorEmp = {};
    fichajes.forEach(f => {
      if (!fichajesPorEmp[f.empleado_id]) fichajesPorEmp[f.empleado_id] = new Set();
      fichajesPorEmp[f.empleado_id].add(f.tipo);
    });

    for (const h of horarios) {
      const empId = h.empleado_id;
      const tipos = fichajesPorEmp[empId] || new Set();
      const sub = JSON.parse(h.subscription);
      const nombre = h.nombre;

      // Helper: convertir "HH:MM:SS" a minutos
      const toMin = t => {
        if (!t) return null;
        const [hh, mm] = t.split(":").map(Number);
        return hh * 60 + mm;
      };

      const checks = [
        // [tipo_esperado, hora_ref_str, turno_label]
        { tipo: "entrada",  hora: h.entrada1, turno: "turno1_entrada",  label: `Entrada`,  ref: h.entrada1 },
        { tipo: "salida",   hora: h.salida1,  turno: "turno1_salida",   label: `Salida`,   ref: h.salida1  },
        { tipo: "entrada2", hora: h.entrada2, turno: "turno2_entrada",  label: `Entrada 2°`, ref: h.entrada2 },
        { tipo: "salida2",  hora: h.salida2,  turno: "turno2_salida",   label: `Salida 2°`,  ref: h.salida2  },
      ];

      for (const chk of checks) {
        if (!chk.hora) continue;           // no hay ese turno asignado
        if (tipos.has(chk.tipo)) continue; // ya fichó

        const minRef = toMin(chk.hora);
        if (minRef === null) continue;

        const minutosPostTurno = horaActualMin - minRef;

        // Notificar si entre 10 y 25 minutos después del horario (ventana)
        if (minutosPostTurno < TOLERANCIA_MINUTOS || minutosPostTurno > 25) continue;

        // Verificar si ya se envió esta notificación hoy para este turno
        const yaEnviada = await sql`
          SELECT id FROM notif_enviadas
          WHERE empleado_id = ${empId}
            AND tipo = ${chk.tipo}
            AND fecha = ${fechaHoy}::date
            AND turno = ${chk.turno}
          LIMIT 1`;

        if (yaEnviada.length > 0) continue;

        // Enviar push
        const horaRef = chk.ref.substring(0, 5);
        const payload = {
          title: "🕐 Bar Ideal",
          body: `No fichaste tu ${chk.label.toLowerCase()}. Turno: ${horaRef}`,
          icon: "/logo-ideal.png",
          badge: "/logo-ideal.png",
          url: "/fichaje-barideal.html"
        };

        const enviado = await enviarPush(sub, payload);

        if (enviado) {
          // Marcar como enviada
          try {
            await sql`
              INSERT INTO notif_enviadas (empleado_id, tipo, fecha, turno)
              VALUES (${empId}, ${chk.tipo}, ${fechaHoy}::date, ${chk.turno})
              ON CONFLICT DO NOTHING`;
          } catch {}
          console.log(`📲 Push enviada a ${nombre} — ${chk.label} ${horaRef}`);
        }
      }
    }
  } catch(e) {
    console.error("Error en cronNotificaciones:", e.message);
  }
}

// Correr el cron cada 5 minutos
setInterval(cronNotificaciones, 5 * 60 * 1000);
// También correr al iniciar (con delay de 30s para que la DB esté lista)
setTimeout(cronNotificaciones, 30000);

// ══════════════════════════════════════════════════
//  HEALTHCHECK
// ══════════════════════════════════════════════════
// Editar empleado de la app
app.put("/api/empleados/:id", async (c) => {
    const id = c.req.param("id");
  const { nombre, apellido, celular, pin } = await c.req.json();
    await sql`UPDATE empleados SET nombre=${nombre}, apellido=${apellido}, celular=${celular}, pin=COALESCE(NULLIF(${pin || ''}, ''), pin) WHERE id=${id}`;
  return c.json({ ok: true });
});

// Eliminar empleado de la app
app.delete("/api/empleados/:id", async (c) => {
  const id = c.req.param("id");
  await sql`DELETE FROM fichajes WHERE empleado_id=${id}`;
  await sql`UPDATE planilla_empleados SET empleado_id=NULL WHERE empleado_id=${id}`;
  await sql`DELETE FROM empleados WHERE id=${id}`;
  return c.json({ ok: true });
});

// Editar empleado de planilla
app.put("/api/planilla/empleados/:id", async (c) => {
  const id = c.req.param("id");
  const { nombre, apellido, rol, pin } = await c.req.json();
    await sql`UPDATE planilla_empleados SET nombre=${nombre}, apellido=${apellido}, rol=${rol}, pin=COALESCE(NULLIF(${pin || ''}, ''), pin) WHERE id=${id}`;
  return c.json({ ok: true });
});

// Eliminar empleado de planilla
app.delete("/api/planilla/empleados/:id", async (c) => {
  const id = c.req.param("id");
  await sql`DELETE FROM horarios WHERE planilla_emp_id=${id}`;
  await sql`DELETE FROM planilla_empleados WHERE id=${id}`;
  return c.json({ ok: true });
});

// Eliminar fichaje individual
app.delete("/api/fichajes/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await sql`DELETE FROM fichajes WHERE id=${id}`;
    return c.json({ ok: true, mensaje: "Fichaje eliminado correctamente" });
  } catch (e) {
    console.error("Error delete-fichaje:", e.message);
    return c.json({ error: e.message }, 500);
  }
});

// Autorizar fichaje individual
app.post("/api/fichajes/:id/autorizar", async (c) => {
  try {
    const id = c.req.param("id");
    await sql`UPDATE fichajes SET autorizado=TRUE WHERE id=${id}`;
    return c.json({ ok: true, mensaje: "Fichaje autorizado correctamente" });
  } catch (e) {
    console.error("Error autorizar-fichaje:", e.message);
    return c.json({ error: e.message }, 500);
  }
});

// Editar fichaje existente (requiere PIN de un encargado para autorizar el cambio)
app.put("/api/fichajes/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { tipo, fecha_hora, pin } = await c.req.json();
    if (!tipo || !fecha_hora || !pin)
      return c.json({ error: "Faltan datos (tipo, fecha_hora, pin)" }, 400);

    const tiposValidos = ["entrada", "salida", "entrada2", "salida2"];
    if (!tiposValidos.includes(tipo))
      return c.json({ error: "tipo inválido" }, 400);

    // Buscar encargado (rol Encargado) que tenga ese PIN
    const [encargado] = await sql`
      SELECT * FROM planilla_empleados
      WHERE rol = 'Encargado' AND pin = ${pin}
      LIMIT 1`;

    if (!encargado)
      return c.json({ error: "PIN incorrecto" }, 403);

    const [fichajeActual] = await sql`SELECT * FROM fichajes WHERE id = ${id}`;
    if (!fichajeActual) return c.json({ error: "Fichaje no encontrado" }, 404);

    // Recalcular secuencia_irregular con el nuevo tipo/fecha_hora
    const fecha = new Date(fecha_hora).toISOString().split("T")[0];
    const otrosFichajes = await sql`
      SELECT tipo FROM fichajes
      WHERE empleado_id = ${fichajeActual.empleado_id} AND id != ${id}
      AND (fecha_hora AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = ${fecha}::date
      ORDER BY fecha_hora ASC`;

    const tiposDia = otrosFichajes.map(f => f.tipo);
    const tieneEntrada = tiposDia.includes('entrada');
    const tieneSalida = tiposDia.includes('salida');
    const tieneEntrada2 = tiposDia.includes('entrada2');

    let secuenciaIrregular = false;
    if (tipo === 'salida' && !tieneEntrada) secuenciaIrregular = true;
    if (tipo === 'entrada2' && !tieneSalida) secuenciaIrregular = true;
    if (tipo === 'salida2' && !tieneEntrada2) secuenciaIrregular = true;

    const [fichajeActualizado] = await sql`
      UPDATE fichajes
      SET tipo = ${tipo}, fecha_hora = ${fecha_hora}, manual = TRUE,
          editado_por = ${encargado.nombre}, secuencia_irregular = ${secuenciaIrregular}
      WHERE id = ${id}
      RETURNING *`;

    console.log(`✏️ Fichaje ${id} editado por ${encargado.nombre}`);
    return c.json(fichajeActualizado, 200);
  } catch (e) {
    console.error("Error PUT /api/fichajes/:id:", e.message);
    return c.json({ error: e.message }, 500);
  }
});
  
app.get("/", (c) => c.json({ app: "Bar Ideal API", version: "2.1", status: "ok" }));

await migrate();
const port = parseInt(Bun.env.PORT ?? "3000");
console.log(`🍺 Bar Ideal API v2.1 corriendo en puerto ${port}`);
Bun.serve({ port, fetch: app.fetch });
