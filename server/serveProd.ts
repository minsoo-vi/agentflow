/**
 * 프로덕션: dist 정적 파일 + /api/reports
 * 사용: npm run build && npm run start
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReportRouter } from './reportRoutes';
import { createPostgresRouter } from './postgresRoutes';
import { createMongoRouter } from './mongoRoutes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const app = express();
app.use('/api/postgres', createPostgresRouter());
app.use('/api/mongo', createMongoRouter());
app.use('/api/reports', createReportRouter());
app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, error: 'not found' });
});
app.use(express.static(path.join(root, 'dist')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    next();
    return;
  }
  res.sendFile(path.join(root, 'dist', 'index.html'), (err) => {
    if (err) next(err);
  });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`[agentflow] http://0.0.0.0:${port}  (reports → ${path.join(root, 'data', 'reports')})`);
});
