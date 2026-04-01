import type { ImportedFileRef } from '../../components/shared/DatasourceFileDropzone';
import type { Node } from '../../types';

/** 팔레트에서 캔버스로 드롭했을 때 생성할 노드(타입별 기본 config 포함) */
export const createPaletteDroppedNode = (
  type: string,
  position: { x: number; y: number },
): Node => ({
  id: `${type}_${Date.now()}`,
  type: type as Node['type'],
  label: type === 'datasource' ? '데이터 가져오기' : `New ${type}`,
  position: { x: position.x, y: position.y },
  metrics: { status: 'idle' },
  config:
    type === 'database'
      ? {
          operation: 'read',
          collection: 'users',
          storageType: 'postgresql',
          query: 'SELECT 1 AS ok',
          dbHost: 'localhost',
          dbPort: 5433,
          dbName: 'testdb',
          dbUser: 'postgres',
          dbPassword: '1234',
        }
      : type === 'vector'
        ? { query: 'search query', storageType: 'vector_db' }
        : type === 'mcp'
          ? { mcpServerUrl: 'http://localhost:8080', mcpMethod: 'get_context' }
          : type === 'report'
            ? { reportFormat: 'markdown' }
            : type === 'storage'
              ? { storagePath: '/data/results', storageType: 'local_storage' }
              : type === 'datasource'
                ? {
                    dataFormat: 'pdf',
                    filePath: './regulations/규정집.pdf',
                    delimiter: ',',
                    inlineSample: '',
                    importedFiles: [] as ImportedFileRef[],
                  }
                : type === 'chunk'
                  ? {
                      chunkStrategy: 'recursive',
                      chunkSize: 1000,
                      chunkOverlap: 200,
                      prompt: '',
                    }
                  : {},
});
