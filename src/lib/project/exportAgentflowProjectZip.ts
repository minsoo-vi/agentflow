import { strToU8, zipSync } from 'fflate';

/** 내보내기·초기 프로젝트에 동일하게 사용 */
export const EXPORT_DEFAULT_REQUIREMENTS = `langgraph>=0.2.0
langchain-core>=0.3.0
`;

export const EXPORT_DEFAULT_README = `# AgentFlow에서 내보낸 프로젝트

캔버스와 동일한 워크플로 스켈레톤이 \`graph.py\`에 생성되어 있습니다.
노드별 커스텀은 \`agents/\`, \`tools/\`, \`mcp/\`, \`storage/\` 아래 \`.py\`를 수정하세요.

## 실행 방법

\`\`\`bash
cd Project
python -m venv .venv
# Windows PowerShell/CMD: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python graph.py
# 또는 python main.py
\`\`\`

환경에 따라 Python 3.10+ 권장입니다.
`;

const mergeDefaults = (fileContents: Record<string, string>): Record<string, string> => {
  const merged = { ...fileContents };
  const req = merged['Project/requirements.txt']?.trim();
  if (!req) {
    merged['Project/requirements.txt'] = EXPORT_DEFAULT_REQUIREMENTS;
  }
  const readme = merged['Project/README.md']?.trim();
  if (!readme) {
    merged['Project/README.md'] = EXPORT_DEFAULT_README;
  }
  return merged;
};

export const buildProjectZipBytes = (fileContents: Record<string, string>): Uint8Array => {
  const merged = mergeDefaults(fileContents);
  const out: Record<string, Uint8Array> = {};
  for (const [path, content] of Object.entries(merged)) {
    const normalized = path.replaceAll('\\', '/');
    if (!normalized.startsWith('Project/')) continue;
    out[normalized] = strToU8(content, true);
  }
  return zipSync(out, { level: 6 });
};

export const downloadProjectZip = (
  fileContents: Record<string, string>,
  baseName = 'agentflow-project',
): void => {
  const bytes = buildProjectZipBytes(fileContents);
  const blob = new Blob([bytes], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.download = `${baseName}-${stamp}.zip`;
  a.click();
  URL.revokeObjectURL(url);
};
