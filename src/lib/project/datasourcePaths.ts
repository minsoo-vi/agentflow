import type { ImportedFileRef } from '../../components/shared/DatasourceFileDropzone';

/** 데이터 형식별 파일 경로 입력란 placeholder */
export const getDatasourceFilePathPlaceholder = (dataFormat: string | undefined): string => {
  switch (dataFormat) {
    case 'pdf':
      return './regulations/규정집.pdf';
    case 'json':
      return './data/input.json';
    case 'csv':
      return './data/input.csv';
    case 'text':
    default:
      return './data/document.txt';
  }
};

/**
 * 드롭·불러오기 후 config 보강: 경로 문자열을 실제 파일명과 맞추고, PDF면 dataFormat을 pdf로 맞춤.
 */
export const mergeImportedFilesIntoDatasourceConfig = (
  files: ImportedFileRef[],
  current: Record<string, unknown> | undefined
): Record<string, unknown> => {
  const names = files.map((f) => f.name).filter(Boolean);
  const anyPdf = files.some(
    (f) =>
      f.name.toLowerCase().endsWith('.pdf') ||
      f.mimeType === 'application/pdf' ||
      Boolean((f as { pdfPages?: number }).pdfPages)
  );

  let filePath: string | undefined;
  if (names.length === 1) {
    filePath = `./regulations/${names[0]}`;
  } else if (names.length > 1) {
    filePath = names.join(', ');
  }

  return {
    ...current,
    importedFiles: files,
    ...(filePath ? { filePath } : {}),
    ...(anyPdf ? { dataFormat: 'pdf' } : {}),
  };
};
