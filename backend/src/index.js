import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { readFileSync } from 'node:fs';

const port = process.env.PORT || 3001;

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST || 'localhost';
  const portNumber = process.env.DB_PORT || 5432;
  const user = process.env.DB_USER || 'postgres';
  const dbName = process.env.DB_NAME || 'evaluation';
  const password = process.env.DB_PASSWORD_FILE
    ? readFileSync(process.env.DB_PASSWORD_FILE, 'utf8').trim()
    : (process.env.DB_PASSWORD || 'postgres');

  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${portNumber}/${dbName}`;
}

const databaseUrl = resolveDatabaseUrl();

const pool = new pg.Pool({
  connectionString: databaseUrl,
});

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'up' });
  } catch (error) {
    console.error('Healthcheck failed:', error.message);
    res.status(503).json({ status: 'error', database: 'down' });
  }
});

app.get('/api/instruction', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM instructions ORDER BY id ASC LIMIT 1');

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No instruction found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

const server = app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});

// Arrêt propre : `docker stop` envoie SIGTERM, Ctrl+C envoie SIGINT
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down...`);
    server.close(() => pool.end().then(() => process.exit(0)));
  });
}
