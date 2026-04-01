import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let workerReady = false;

const ensurePdfWorker = (): void => {
  if (workerReady) return;
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  workerReady = true;
};

/**
 * 브라우저에서 PDF 바이너리로부터 텍스트만 추출 (규정집·문서 RAG용).
 */
export const extractTextFromPdfBuffer = async (
  data: ArrayBuffer
): Promise<{ text: string; numPages: number }> => {
  ensurePdfWorker();
  const loadingTask = getDocument({ data });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const parts: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => {
        if (item && typeof item === 'object' && 'str' in item && typeof (item as { str: string }).str === 'string') {
          return (item as { str: string }).str;
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');
    parts.push(`--- 페이지 ${i} ---\n${pageText.trim()}`);
  }

  const text = parts.join('\n\n').trim();
  return { text: text || '(추출된 텍스트 없음)', numPages };
};
