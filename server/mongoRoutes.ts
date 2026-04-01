import 'dotenv/config';
import express from 'express';
import { MongoClient } from 'mongodb';

export type MongoDbConfigBody = {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  /** 전체 URI가 있으면 host/port 등보다 우선 */
  connectionUri?: string;
};

type FindBody = {
  db: MongoDbConfigBody;
  collection: string;
  filter?: Record<string, unknown>;
  limit?: number;
};

type InsertDocumentsBody = {
  db: MongoDbConfigBody;
  collection: string;
  documents: Record<string, unknown>[];
  if_exists?: 'replace' | 'append';
};

const buildMongoUri = (db: MongoDbConfigBody): string => {
  const uri = String(db.connectionUri ?? '').trim();
  if (uri) return uri;

  const host = db.host || '127.0.0.1';
  const port = Number(db.port ?? 27017);
  const database = db.database || 'test';
  const user = db.user ?? '';
  const password = db.password ?? '';

  if (user) {
    const u = encodeURIComponent(user);
    const p = encodeURIComponent(password);
    return `mongodb://${u}:${p}@${host}:${port}/${database}?authSource=admin`;
  }
  return `mongodb://${host}:${port}/${database}`;
};

export const createMongoRouter = () => {
  const router = express.Router();
  router.use(express.json({ limit: '20mb' }));

  router.post('/find', async (req, res) => {
    let client: MongoClient | null = null;
    try {
      const body = (req.body ?? {}) as FindBody;
      const collName = String(body.collection ?? '').trim();
      if (!collName) {
        res.status(400).json({ ok: false, error: 'collection이 필요합니다.' });
        return;
      }
      if (!body.db) {
        res.status(400).json({ ok: false, error: 'db 연결 정보가 필요합니다.' });
        return;
      }

      const uri = buildMongoUri(body.db);
      client = new MongoClient(uri);
      await client.connect();

      const dbName = String(body.db.database || 'test');
      const database = client.db(dbName);
      const coll = database.collection(collName);

      const filter = body.filter && typeof body.filter === 'object' ? body.filter : {};
      const limit = Math.min(Math.max(Number(body.limit) || 100, 1), 500);

      const rows = await coll.find(filter).limit(limit).toArray();
      res.json({
        ok: true,
        row_count: rows.length,
        rows,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'mongo find failed';
      res.status(500).json({ ok: false, error: msg });
    } finally {
      if (client) {
        await client.close().catch(() => {});
      }
    }
  });

  router.post('/insert-documents', async (req, res) => {
    let client: MongoClient | null = null;
    try {
      const body = (req.body ?? {}) as InsertDocumentsBody;
      const collName = String(body.collection ?? '').trim();
      const docs = Array.isArray(body.documents) ? body.documents : [];
      if (!collName) {
        res.status(400).json({ ok: false, error: 'collection이 필요합니다.' });
        return;
      }
      if (!body.db) {
        res.status(400).json({ ok: false, error: 'db 연결 정보가 필요합니다.' });
        return;
      }
      if (docs.length === 0) {
        res.status(400).json({ ok: false, error: 'documents가 비어 있습니다.' });
        return;
      }

      const uri = buildMongoUri(body.db);
      client = new MongoClient(uri);
      await client.connect();

      const dbName = String(body.db.database || 'test');
      const database = client.db(dbName);
      const coll = database.collection(collName);

      if (body.if_exists === 'replace') {
        await coll.deleteMany({});
      }

      const result = await coll.insertMany(docs);
      res.json({
        ok: true,
        collection: collName,
        inserted_count: result.insertedCount,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'mongo insert failed';
      res.status(500).json({ ok: false, error: msg });
    } finally {
      if (client) {
        await client.close().catch(() => {});
      }
    }
  });

  return router;
};
