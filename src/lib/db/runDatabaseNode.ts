import type { ExecuteNodeInput, ExecuteNodeResult } from '../../types/simulation';
import type { DatabaseConnectionConfig } from './types';

const buildConn = (config: DatabaseConnectionConfig) => ({
  host: config.dbHost || 'localhost',
  port: Number(config.dbPort ?? 5433),
  database: config.dbName || 'testdb',
  user: config.dbUser || 'postgres',
  password: config.dbPassword || '1234',
});

const buildMongoConn = (config: DatabaseConnectionConfig) => ({
  host: config.dbHost || '127.0.0.1',
  port: Number(config.dbPort ?? 27017),
  database: config.dbName || 'test',
  user: config.dbUser,
  password: config.dbPassword,
  ...(config.connectionUri ? { connectionUri: config.connectionUri } : {}),
});

const NOT_IMPLEMENTED = (name: string): ExecuteNodeResult => ({
  message: `[Database] ${name} 백엔드는 아직 서버 API 연동이 없습니다. PostgreSQL 또는 MongoDB를 선택하세요.`,
  status: 'error',
});

/**
 * database 노드 실행 — 스토리지 타입별 fetch 분기 (브라우저 → /api/* )
 */
export async function runDatabaseNode(
  config: Record<string, unknown> | undefined,
  input: ExecuteNodeInput,
): Promise<ExecuteNodeResult> {
  const c = (config ?? {}) as DatabaseConnectionConfig;
  const op = c.operation || 'read';
  const dbType = c.storageType || 'postgresql';
  const tableOrCollection = c.collection || 'csv_table';

  if (dbType === 'postgresql') {
    const db = buildConn(c);

    if (op === 'write') {
      const inputObj = (input || {}) as Record<string, unknown>;
      const headers = Array.isArray(inputObj.headers) ? inputObj.headers : [];
      const rows = Array.isArray(inputObj.rows) ? inputObj.rows : [];

      if (!headers.length || !rows.length) {
        return {
          message: '[Database] write에 필요한 headers/rows가 없습니다.',
          status: 'error',
        };
      }

      const res = await fetch('/api/postgres/insert-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_name: tableOrCollection,
          if_exists: 'replace',
          db,
          headers,
          rows,
        }),
      });

      const data = await res.json();
      return {
        message: res.ok ? `[Postgres] ${tableOrCollection} 적재 완료` : `[ERROR] ${data?.error || '적재 실패'}`,
        data,
        status: res.ok ? 'success' : 'error',
      };
    }

    if (op === 'read') {
      const query = String(c.query || '').trim();
      if (!query) {
        return {
          message: '[Database] read를 위해 SQL query(config.query)가 필요합니다.',
          status: 'error',
        };
      }

      const res = await fetch('/api/postgres/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: query, db }),
      });

      const data = await res.json();
      return {
        message: res.ok ? `[Postgres] 조회 완료` : `[ERROR] ${data?.error || '조회 실패'}`,
        data,
        status: res.ok ? 'success' : 'error',
      };
    }

    return {
      message: `[Database] PostgreSQL에서 지원하지 않는 operation: ${op}`,
      status: 'error',
    };
  }

  if (dbType === 'mongodb') {
    const db = buildMongoConn(c);

    if (op === 'write') {
      const inputObj = (input || {}) as Record<string, unknown>;
      const headers = Array.isArray(inputObj.headers) ? (inputObj.headers as string[]) : [];
      const rows = Array.isArray(inputObj.rows) ? (inputObj.rows as Record<string, unknown>[]) : [];

      let documents: Record<string, unknown>[] = [];
      if (headers.length && rows.length) {
        documents = rows.map((row) => {
          const doc: Record<string, unknown> = {};
          for (const h of headers) {
            doc[h] = row[h] ?? null;
          }
          return doc;
        });
      } else if (Array.isArray(inputObj.documents)) {
        documents = inputObj.documents as Record<string, unknown>[];
      }

      if (!documents.length) {
        return {
          message: '[Database] MongoDB write에 headers+rows 또는 documents[]가 필요합니다.',
          status: 'error',
        };
      }

      const res = await fetch('/api/mongo/insert-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          db,
          collection: tableOrCollection,
          documents,
          if_exists: 'replace',
        }),
      });

      const data = await res.json();
      return {
        message: res.ok
          ? `[MongoDB] ${tableOrCollection}에 ${documents.length}건 삽입`
          : `[ERROR] ${data?.error || '삽입 실패'}`,
        data,
        status: res.ok ? 'success' : 'error',
      };
    }

    if (op === 'read') {
      let filter: Record<string, unknown> = {};
      const rawFilter = String(c.mongoFilter ?? '').trim();
      if (rawFilter) {
        try {
          const parsed = JSON.parse(rawFilter) as unknown;
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            filter = parsed as Record<string, unknown>;
          } else {
            return {
              message: '[Database] mongoFilter는 JSON 객체여야 합니다. 예: {} 또는 {"status":"active"}',
              status: 'error',
            };
          }
        } catch {
          return {
            message: '[Database] mongoFilter JSON 파싱 실패',
            status: 'error',
          };
        }
      }

      const res = await fetch('/api/mongo/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          db,
          collection: tableOrCollection,
          filter,
          limit: 100,
        }),
      });

      const data = await res.json();
      return {
        message: res.ok ? `[MongoDB] 조회 완료` : `[ERROR] ${data?.error || '조회 실패'}`,
        data,
        status: res.ok ? 'success' : 'error',
      };
    }

    return {
      message: `[Database] MongoDB에서 지원하지 않는 operation: ${op}`,
      status: 'error',
    };
  }

  if (dbType === 'firestore') {
    return NOT_IMPLEMENTED('Firestore');
  }
  if (dbType === 'redis') {
    return NOT_IMPLEMENTED('Redis');
  }

  return {
    message: `[Database] 알 수 없는 storageType: ${dbType}. postgresql | mongodb 를 사용하세요.`,
    status: 'error',
  };
}
