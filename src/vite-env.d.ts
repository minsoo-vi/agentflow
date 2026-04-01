/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AF_REPORT_API_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
