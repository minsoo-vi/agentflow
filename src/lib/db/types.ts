/** database 노드 config에서 공통으로 쓰는 연결 필드 */
export type DatabaseConnectionConfig = {
  storageType?: string;
  collection?: string;
  operation?: string;
  query?: string;
  mongoFilter?: string;
  dbHost?: string;
  dbPort?: number;
  dbName?: string;
  dbUser?: string;
  dbPassword?: string;
  connectionUri?: string;
};

export type SupportedDatabaseBackend = 'postgresql' | 'mongodb';
