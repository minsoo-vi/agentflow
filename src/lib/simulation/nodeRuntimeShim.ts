type ChildProcessSync = {
  execSync: (command: string) => Buffer | string;
};

type FsSync = {
  writeFileSync: (path: string, data: string) => void;
};

/**
 * 브라우저·엣지 런타임에서는 `require`가 없거나 모듈 로드가 실패할 수 있음 → null.
 * Node/Electron 등에서는 `child_process` 사용 가능.
 */
export const tryGetChildProcess = (): ChildProcessSync | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('child_process') as ChildProcessSync;
  } catch {
    return null;
  }
};

export const tryGetFs = (): FsSync | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('fs') as FsSync;
  } catch {
    return null;
  }
};
