/**
 * Decision Duel — Production-Ready Database & REST API Backend Server
 * Persists all 5 ER Diagram entities (ROOM, PLAYER, OPTION, DUEL, VOTE) + USER accounts
 * directly to database/decision_duel_db.json on disk.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', 'database', 'decision_duel_db.json');
const SCHEMA_FILE = path.join(__dirname, '..', 'database', 'schema.sql');
const PORT = process.env.PORT || 4000;

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { users: [], rooms: {} };
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (err) {
    console.error('Error reading DB file:', err);
    return { users: [], rooms: {} };
  }
}

function writeDb(data) {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB file:', err);
  }
}

function readSchemaSql() {
  try {
    return fs.existsSync(SCHEMA_FILE) ? fs.readFileSync(SCHEMA_FILE, 'utf-8') : '';
  } catch {
    return '';
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Health check endpoint for cloud deployment environments
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', uptime: process.uptime(), timestamp: Date.now() }));
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/api/db')) {
    const db = readDb();
    const roomSnapshots = Object.values(db.rooms || {});
    const relational = {
      status: 'online',
      environment: process.env.NODE_ENV || 'production',
      database_file: DB_FILE,
      schema_file: SCHEMA_FILE,
      schema_sql: readSchemaSql(),
      counts: {
        USER: (db.users || []).length,
        ROOM: roomSnapshots.length,
        PLAYER: roomSnapshots.flatMap((s) => s.players || []).length,
        OPTION: roomSnapshots.flatMap((s) => s.options || []).length,
        DUEL: roomSnapshots.flatMap((s) => s.duels || []).length,
        VOTE: roomSnapshots.flatMap((s) => s.votes || []).length,
      },
      tables: {
        USER: db.users || [],
        ROOM: roomSnapshots.map((s) => s.room).filter(Boolean),
        PLAYER: roomSnapshots.flatMap((s) => s.players || []),
        OPTION: roomSnapshots.flatMap((s) => s.options || []),
        DUEL: roomSnapshots.flatMap((s) => s.duels || []),
        VOTE: roomSnapshots.flatMap((s) => s.votes || []),
      },
      raw_rooms: db.rooms || {},
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(relational, null, 2));
    return;
  }

  if (req.method === 'POST' && url.pathname.startsWith('/api/rooms/')) {
    const code = url.pathname.replace('/api/rooms/', '').toUpperCase();
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const snapshot = JSON.parse(body);
        const db = readDb();
        db.rooms = db.rooms || {};
        db.rooms[code] = snapshot;
        writeDb(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, roomCode: code }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/users') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const users = JSON.parse(body);
        const db = readDb();
        db.users = users;
        writeDb(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, count: users.length }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`🗄️  Decision Duel Database Backend running at: http://localhost:${PORT}/api/db`);
  console.log(`📁 Database File: ${DB_FILE}`);
  console.log(`=============================================================\n`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
