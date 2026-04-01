import 'dotenv/config';
import express from 'express';
import { Client } from 'pg';

type DbConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
};

type InsertCsvBody = {
  table_name: string;
  if_exists?: 'fail' | 'replace' | 'append';
  db: DbConfig;
  headers: string[];
  rows: Record<string, unknown>[];
};

type QueryBody ={
  sql : string;
  db: DbConfig;
};

const sanitizeIdentifier = (name: string) =>
  String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_가-힣]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^(\d)/, 'col_$1')
    .replace(/^$/, 'column');

const inferPgType = (values: unknown[]): string => {
  const nonEmpty = values
    .map((v) => String(v ?? '').trim())
    .filter((v) => v !== '');

  if (nonEmpty.length === 0) return 'TEXT';

  const isInt = nonEmpty.every((v) => /^[-+]?\d+$/.test(v));
  const isFloat = nonEmpty.every((v) => /^[-+]?\d+(\.\d+)?$/.test(v));

  if (isInt) return 'BIGINT';
  if (isFloat) return 'DOUBLE PRECISION';
  return 'TEXT';
};

export const createPostgresRouter = () => {
  const router = express.Router();
  router.use(express.json({ limit: '20mb' }));

  router.post('/query', async (req, res) => {
    console.log('[POSTGRES API] /query called');
    let client: Client | null = null;
    try {
      const body = (req.body ?? {}) as QueryBody;
      const sql = String(body.sql ?? '').trim();
      const db = body.db;

      if (!db) {
        res.status(400).json({ ok: false, error: 'db 정보가 필요합니다.' });
        return;
      }

      if (!sql) {
        res.status(400).json({ ok: false, error: 'sql이 비어 있습니다.' });
        return;
      }

      if (!/^select/i.test(sql)) {
        res.status(400).json({ ok: false, error: 'select 쿼리만 허용됩니다.' });
        return;
      }

      client = new Client({
        host: db.host,
        port: db.port,
        database: db.database,
        user: db.user,
        password: db.password,
      });

      await client.connect();

      const result = await client.query(sql);

      res.json({
        ok: true,
        row_count: result.rows.length,
        rows: result.rows,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'query failed';
      res.status(500).json({ ok: false, error: msg });
    } finally {
      if (client) {
        await client.end().catch(() => {});
      }
    }
  });

  router.post('/insert-csv', async (req, res) => {
    console.log('[POSTGRES API] /insert-csv called');
    let client: Client | null = null;

    try {
      const body = (req.body ?? {}) as InsertCsvBody;

      const tableName = sanitizeIdentifier(body.table_name || 'csv_table');
      const ifExists = body.if_exists || 'fail';
      const headers = Array.isArray(body.headers) ? body.headers : [];
      const rows = Array.isArray(body.rows) ? body.rows : [];
      const db = body.db;

      if (!db) {
        res.status(400).json({ ok: false, error: 'db 정보가 필요합니다.' });
        return;
      }

      if (!headers.length) {
        res.status(400).json({ ok: false, error: 'headers가 비어 있습니다.' });
        return;
      }

      if (!rows.length) {
        res.status(400).json({ ok: false, error: 'rows가 비어 있습니다.' });
        return;
      }

      const safeHeaders: string[] = [];
      const used = new Set<string>();

      for (const h of headers) {
        let col = sanitizeIdentifier(h);
        const base = col;
        let idx = 1;
        while (used.has(col)) {
          col = `${base}_${idx++}`;
        }
        used.add(col);
        safeHeaders.push(col);
      }

      const columnsInfo = headers.map((original, i) => {
        const values = rows.map((r) => r?.[original]);
        return {
          original_name: original,
          name: safeHeaders[i],
          type: inferPgType(values),
        };
      });

      client = new Client({
        host: db.host,
        port: db.port,
        database: db.database,
        user: db.user,
        password: db.password,
      });

      await client.connect();

      const existsQuery = `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )
      `;
      const existsResult = await client.query(existsQuery, [tableName]);
      const exists = Boolean(existsResult.rows?.[0]?.exists);

      if (exists) {
        if (ifExists === 'fail') {
          res.status(400).json({
            ok: false,
            error: `table '${tableName}' already exists`,
          });
          return;
        } else if (ifExists === 'replace') {
          await client.query(`DROP TABLE IF EXISTS "${tableName}"`);
        }
      }

      if (!exists || ifExists === 'replace') {
        const colDefs = columnsInfo
          .map((c) => `"${c.name}" ${c.type}`)
          .join(', ');

        await client.query(`CREATE TABLE "${tableName}" (${colDefs})`);
      }

      const insertColumns = columnsInfo.map((c) => `"${c.name}"`).join(', ');

      for (const row of rows) {
        const values = headers.map((h) => {
          const v = row?.[h];
          return v === '' ? null : v;
        });
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        await client.query(
          `INSERT INTO "${tableName}" (${insertColumns}) VALUES (${placeholders})`,
          values
        );
      }

      res.json({
        ok: true,
        table_name: tableName,
        inserted_rows: rows.length,
        columns: columnsInfo,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'insert failed';
      res.status(500).json({ ok: false, error: msg });
    } finally {
      if (client) {
        await client.end().catch(() => {});
      }
    }
  });

  return router;
};