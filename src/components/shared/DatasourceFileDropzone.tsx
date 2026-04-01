import React, { useCallback, useRef, useState } from 'react';
import { Upload, Trash2, FileText } from 'lucide-react';
import { cn } from '../../lib/ui/utils';
import { extractTextFromPdfBuffer } from '../../lib/documents/pdfText';

export type ImportedFileRef = {
  name: string;
  content: string;
  mimeType?: string;
  size?: number;
  /** PDF에서 텍스트 추출 시 페이지 수 */
  pdfPages?: number;
  /** 로드 실패 시 사용자에게 표시 */
  loadError?: string;
};

const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsText(file, 'UTF-8');
  });

const isPdfFile = (file: File): boolean =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const readFileAsImportedContent = async (file: File): Promise<ImportedFileRef> => {
  if (isPdfFile(file)) {
    try {
      const buf = await file.arrayBuffer();
      const { text, numPages } = await extractTextFromPdfBuffer(buf);
      return {
        name: file.name,
        content: text,
        mimeType: file.type || 'application/pdf',
        size: file.size,
        pdfPages: numPages,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Datasource] PDF 텍스트 추출 실패:', file.name, err);
      return {
        name: file.name,
        content: '',
        mimeType: file.type || 'application/pdf',
        size: file.size,
        loadError: `PDF 처리 실패: ${msg}`,
      };
    }
  }
  const content = await readFileAsText(file);
  return {
    name: file.name,
    content,
    mimeType: file.type || undefined,
    size: file.size,
  };
};

type DatasourceFileDropzoneProps = {
  importedFiles: ImportedFileRef[];
  onImportedFilesChange: (files: ImportedFileRef[]) => void;
  className?: string;
};

export const DatasourceFileDropzone: React.FC<DatasourceFileDropzoneProps> = ({
  importedFiles,
  onImportedFilesChange,
  className,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleAppendFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const arr = Array.from(fileList);
      if (arr.length === 0) return;

      const next: ImportedFileRef[] = [];
      for (const file of arr) {
        try {
          next.push(await readFileAsImportedContent(file));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error('[Datasource] 파일 읽기 실패:', file.name, err);
          next.push({
            name: file.name,
            content: '',
            size: file.size,
            mimeType: file.type,
            loadError: `읽기 실패: ${msg}`,
          });
        }
      }
      if (next.length === 0) return;
      onImportedFilesChange([...importedFiles, ...next]);
    },
    [importedFiles, onImportedFilesChange]
  );

  const isFileDrag = (e: React.DragEvent) => {
    const types = e.dataTransfer?.types;
    if (!types) return false;
    return Array.from(types).includes('Files');
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      e.dataTransfer.dropEffect = 'copy';
    } catch {
      /* ignore */
    }
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      e.dataTransfer.dropEffect = 'copy';
    } catch {
      /* ignore */
    }
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const related = e.relatedTarget as Node | null;
    if (e.currentTarget.contains(related)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const { files } = e.dataTransfer;
      if (!files?.length) return;
      await handleAppendFiles(files);
    },
    [handleAppendFiles]
  );

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      if (!files?.length) return;
      await handleAppendFiles(files);
      e.target.value = '';
    },
    [handleAppendFiles]
  );

  const handleOpenPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleKeyDownZone = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpenPicker();
      }
    },
    [handleOpenPicker]
  );

  const handleRemoveAt = useCallback(
    (index: number) => {
      onImportedFilesChange(importedFiles.filter((_, i) => i !== index));
    },
    [importedFiles, onImportedFilesChange]
  );

  const handleClearAll = useCallback(() => {
    onImportedFilesChange([]);
  }, [onImportedFilesChange]);

  return (
    <div className={cn('space-y-3', className)}>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        accept=".csv,.tsv,.txt,.json,.md,.log,.pdf,text/plain,text/csv,application/json,application/pdf"
        aria-hidden
        tabIndex={-1}
        onChange={handleFileInputChange}
      />

      <div
        role="region"
        aria-label="파일을 여기에 놓거나 클릭하여 여러 파일을 선택하세요"
        tabIndex={0}
        onKeyDown={handleKeyDownZone}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleOpenPicker}
        className={cn(
          'relative z-10 rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] pointer-events-auto',
          isDragging ? 'border-teal-400 bg-teal-500/15' : 'border-white/20 bg-white/[0.03] hover:border-teal-500/40 hover:bg-teal-500/5'
        )}
      >
        <Upload className="mx-auto mb-2 text-teal-400" size={22} aria-hidden />
        <p className="text-xs font-medium text-white/90">파일을 드래그하여 놓기</p>
        <p className="text-[10px] text-gray-500 mt-1">CSV, TXT, JSON, PDF(규정집) 등 · 여러 파일 가능</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenPicker();
          }}
          className="mt-3 text-[10px] font-bold uppercase tracking-wider text-teal-400 hover:text-teal-300"
        >
          찾아보기
        </button>
      </div>

      {importedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              불러온 파일 ({importedFiles.length})
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[10px] text-red-400/90 hover:text-red-300 font-medium"
            >
              모두 제거
            </button>
          </div>
          <ul className="max-h-40 overflow-y-auto custom-scrollbar space-y-1.5" role="list">
            {importedFiles.map((f, index) => (
              <li
                key={`${f.name}-${index}-${(f.size ?? 0)}`}
                className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-2 py-1.5"
              >
                <FileText size={14} className="text-teal-400 shrink-0" aria-hidden />
                <span
                  className={cn(
                    'text-[11px] truncate flex-1 min-w-0',
                    f.loadError ? 'text-amber-400/95' : 'text-gray-200'
                  )}
                  title={f.loadError ? `${f.name} — ${f.loadError}` : f.name}
                >
                  {f.name}
                  {f.loadError ? ` · ${f.loadError}` : ''}
                </span>
                <span className="text-[9px] text-gray-500 shrink-0 tabular-nums">
                  {typeof f.pdfPages === 'number' && f.pdfPages > 0 ? `${f.pdfPages}p · ` : ''}
                  {typeof f.size === 'number' ? `${(f.size / 1024).toFixed(1)}KB` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveAt(index)}
                  className="p-1 rounded-md hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors shrink-0"
                  aria-label={`${f.name} 제거`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
