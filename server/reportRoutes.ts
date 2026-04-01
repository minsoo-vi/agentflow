/**
 * 보고서 본문을 프로젝트 디렉터리(또는 AF_REPORTS_DIR)에 파일로 저장합니다.
 * 개발: Vite configureServer 에서 /api/reports 로 마운트
 * 운영: serveProd.ts 에서 동일 라우터 사용
 */

import 'dotenv/config';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';

export const getReportsDir = (): string => {
  const fromEnv = process.env.AF_REPORTS_DIR?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.join(process.cwd(), 'data', 'reports');
};

const sanitizeFilePart = (s: string, max: number) =>
  String(s ?? '')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, max);

export const createReportRouter = () => {
  const router = express.Router();
  router.use(express.json({ limit: '12mb' }));

  router.use((req, res, next) => {
    const secret = process.env.AF_REPORT_API_SECRET?.trim();
    if (!secret) {
      next();
      return;
    }
    const h = req.headers['x-agentflow-report-key'];
    if (h !== secret) {
      res.status(401).json({ ok: false, error: 'unauthorized' });
      return;
    }
    next();
  });

  router.post('/', async (req, res) => {
    try {
      const body = req.body ?? {};
      const runId = String(body.runId ?? '').trim();
      const nodeId = String(body.nodeId ?? '').trim();
      const nodeLabel = String(body.nodeLabel ?? 'report').trim();
      const format = String(body.format ?? 'markdown').trim();
      const content = String(body.content ?? '');
      const message =
        typeof body.message === 'string' ? body.message : undefined;
      const clientId = String(body.id ?? '').trim();
      const createdAt = String(body.createdAt ?? '').trim();

      if (!runId || !nodeId || !content.trim()) {
        res.status(400).json({
          ok: false,
          error: 'runId, nodeId, content 가 필요합니다.',
        });
        return;
      }

      const dir = getReportsDir();
      await fs.mkdir(dir, { recursive: true });

      const ext =
        format === 'markdown' || format === 'md' ? 'md' : 'txt';
      const safeRun = sanitizeFilePart(runId, 64);
      const safeNode = sanitizeFilePart(nodeId, 24);
      const safeLabel = sanitizeFilePart(nodeLabel, 48);
      let stamp: string;
      try {
        stamp = createdAt
          ? new Date(createdAt).toISOString().replace(/[:.]/g, '-')
          : new Date().toISOString().replace(/[:.]/g, '-');
      } catch {
        stamp = new Date().toISOString().replace(/[:.]/g, '-');
      }
      const idTail = clientId ? `_${clientId.slice(-10)}` : '';
      const fileName = `${safeRun}__${safeNode}__${safeLabel}${idTail}__${stamp}.${ext}`;
      const fullPath = path.join(dir, fileName);

      const metaLines = [
        '---',
        `runId: ${runId}`,
        `nodeId: ${nodeId}`,
        `nodeLabel: ${nodeLabel.replace(/\n/g, ' ')}`,
        `format: ${format}`,
        createdAt ? `createdAt: ${createdAt}` : null,
        message ? `message: ${message.replace(/\n/g, ' ').slice(0, 500)}` : null,
        `savedAt: ${new Date().toISOString()}`,
        '---',
        '',
      ]
        .filter(Boolean)
        .join('\n');

      await fs.writeFile(fullPath, metaLines + content, 'utf8');

      const manifestPath = path.join(dir, '_manifest.jsonl');
      await fs.appendFile(
        manifestPath,
        JSON.stringify({
          runId,
          nodeId,
          nodeLabel,
          format,
          fileName,
          savedAt: new Date().toISOString(),
          clientId: clientId || undefined,
        }) + '\n',
        'utf8'
      );

      const relativePath = path.relative(process.cwd(), fullPath);
      res.json({
        ok: true,
        fileName,
        relativePath,
        absolutePath: fullPath,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'save failed';
      res.status(500).json({ ok: false, error: msg });
    }
  });

  return router;
};
