import { 
  Search, 
  Cpu, 
  Zap, 
  Layout, 
  Database, 
  Box, 
  HardDrive, 
  GitBranch, 
  Folder, 
  Code,
  FileText
} from 'lucide-react';
import { RegistryItem, WorkflowGraph } from './types';

export interface Skill {
  id: string;
  /** 짧은 한글 표기 (UI·프롬프트용) */
  name: string;
  /** AgentFlow 동작·노드 타입과 연결된 정밀 설명 */
  description: string;
}

/**
 * 노드 `skills` 배열·AI 워크플로우 생성에 쓰이는 스킬 카탈로그.
 * id는 저장된 그래프와 호환을 위해 안정적으로 유지합니다.
 */
export const SKILLS_REGISTRY: Skill[] = [
  {
    id: 'nlp',
    name: '자연어 처리',
    description:
      '에이전트(agent) 노드의 대화·추론·요약. config.model·systemInstruction·description과 결합되어 시뮬레이션에서 Gemini 호출 입력으로 전달됩니다.',
  },
  {
    id: 'code_generation',
    name: '코드 생성',
    description:
      '코드 작성·리팩터·스크립트 생성. tool·agent와 연계하며 python 노드(config.pythonCode)와는 별도로, 에이전트 역할 힌트로 사용합니다.',
  },
  {
    id: 'data_analysis',
    name: '데이터 분석',
    description:
      '수치·표·로그에서 인사이트 도출, 통계적 요약. datasource·database·vector 결과를 입력으로 삼는 에이전트에 부여합니다.',
  },
  {
    id: 'image_generation',
    name: '이미지 생성',
    description:
      '이미지 생성·편집 의도. MODEL_REGISTRY의 이미지 특화 모델과 함께 쓰는 에이전트에 적합합니다.',
  },
  {
    id: 'data_import',
    name: '데이터 가져오기',
    description:
      'datasource 노드 전용: config.dataFormat(csv|text|json|pdf)·delimiter·filePath·inlineSample. importedFiles에 PDF(규정집)를 넣으면 pdf.js로 텍스트 추출 후 시뮬레이션. 그 외는 UTF-8 텍스트·다중 CSV·JSON 규칙 동일. CSV를 DB로 이어 적재할 때는 하류 database(write)와 스킬 csv_database_load를 함께 씁니다.',
  },
  {
    id: 'database_management',
    name: '데이터베이스',
    description:
      'database 노드: config.operation(read|write 등)·collection·storageType. 시뮬레이션에서 컬렉션 단위 read/write 메시지 및 결과 객체. CSV 파일을 DB에 쓰는 하류 단계는 csv_database_load와 함께 쓰면 의도가 명확해집니다.',
  },
  {
    id: 'csv_database_load',
    name: 'CSV DB 적재',
    description:
      'CSV를 DB에 넣는 ETL 흐름 전용 힌트: datasource → database 엣지.datasource는 config.dataFormat csv·delimiter·filePath 또는 importedFiles, skills에 data_import + csv_database_load.database는 config.operation write·collection(테이블/컬렉션명)·storageType(postgresql|mongodb|firestore 등), skills에 database_management + csv_database_load. 자연어 키워드: CSV 적재, DB 삽입, bulk insert, 스프레드시트 업로드, PostgreSQL COPY, 엑셀보내기 적재.',
  },
  {
    id: 'vector_retrieval',
    name: '벡터 검색',
    description:
      'vector 노드: config.storageType·query. 시맨틱 검색 시뮬레이션 및 유사 문서 목록 반환.',
  },
  {
    id: 'storage_persistence',
    name: '스토리지 저장',
    description:
      'storage 노드: config.storagePath·storageType. 페이로드를 경로에 맞게 저장하는 시뮬레이션.',
  },
  {
    id: 'file_io',
    name: '파일 I/O',
    description:
      '일반적인 파일 읽기/쓰기·경로 처리. data_import(구조화 소스)와 구분해 도구·에이전트 역할 힌트로 사용.',
  },
  {
    id: 'web_scraping',
    name: '웹 스크래핑',
    description:
      '웹 페이지에서 본문·표 등 수집. MCP 브라우저·검색 도구와 조합 가능한 에이전트 스킬입니다.',
  },
  {
    id: 'search',
    name: '웹 검색',
    description:
      'google_search·tavily_search 등 tool 노드와 대응. 실시간 정보가 필요한 에이전트에 부여합니다.',
  },
  {
    id: 'api_interaction',
    name: 'API 연동',
    description:
      'REST·HTTP 등 외부 API 호출 패턴. mcp·tool과 구분하여 범용 API 작업 에이전트에 사용합니다.',
  },
  {
    id: 'mcp_integration',
    name: 'MCP 연동',
    description:
      'mcp 노드: config.mcpServerUrl·mcpMethod·mcpId 등. MCP 서버 호출 시뮬레이션 및 payload 반환.',
  },
  {
    id: 'workflow_routing',
    name: '분기·라우팅',
    description:
      'router 노드: routingStrategy llm_decider. 출구 엣지의 label 목록을 LLM에 제시하고 응답 문자열을 label과 정규화·부분 매칭. 시뮬레이션에서 라우터는 lastSubstantiveOutput(이전 에이전트 출력)을 덮어쓰지 않음.',
  },
  {
    id: 'document_reporting',
    name: '문서·보고서',
    description:
      'report 노드: config.reportFormat(markdown 등). 로컬 report_op.py 우선, 실패 시 Gemini로 최종 본문 생성 후 content·response로 하류·종료 노드에 전달.',
  },
  {
    id: 'multi_agent_review',
    name: '멀티에이전트·비평가',
    description:
      '작성 agent → 비평가 agent → router → 통과 시 report → end 패턴. router→end 직결이면 insertReportBetweenRouterAndEnd 후처리로 최종 보고서 노드 삽입 가능. 엣지 label은 라우터 LLM이 그대로 선택하도록 짧은 한글 권장.',
  },
  {
    id: 'team_coordination',
    name: '팀 조율',
    description:
      'team 노드: config.teamStrategy(collaborative 등). 다중 에이전트 협업 시뮬레이션 및 coordination_log.',
  },
  {
    id: 'ingest_pipeline',
    name: '문서 인제스트(RAG) 파이프라인',
    description:
      '전체 RAG를 한 번에 묶는 옛 힌트. RAG 챗봇·운영 설계에서는 rag_embedding_flow(인덱싱)와 rag_query_flow(질의)를 분리하는 것을 권장. 단계 스킬: rag_document_load, rag_chunk_embed_index, rag_semantic_fetch, rag_grounded_answer.',
  },
  {
    id: 'rag_embedding_flow',
    name: 'Embedding Flow(인덱싱)',
    description:
      '지식베이스 구축 전용: datasource|ingest → chunk → embed → storage|database. 문서·규정집을 넣어 청크·벡터·저장까지. 사용자 채팅 질문은 이 경로에 넣지 않고, 별도 RAG Flow에서 질의만 다룸. 스킬: rag_document_load, rag_chunk_embed_index, data_import.',
  },
  {
    id: 'rag_query_flow',
    name: 'RAG Flow(질의·답변)',
    description:
      '챗봇 질의 전용: start(사용자 질문) → retrieve|vector → agent(rag_grounded_answer) → (report) → end. Embedding Flow로 만들어진 인덱스를 전제로 검색 컨텍스트를 agent에 전달. 스킬: rag_semantic_fetch, vector_retrieval, rag_grounded_answer, nlp.',
  },
  {
    id: 'rag_document_load',
    name: 'RAG 문서 로드',
    description:
      '지식 원문 수집: datasource(파일·텍스트)·ingest 노드. 다중 파일은 data_import와 함께 쓰고, 다음은 chunk 또는 embed로 연결합니다.',
  },
  {
    id: 'rag_chunk_embed_index',
    name: 'RAG 청킹·임베딩',
    description:
      'chunk·embed 노드: LangChain Text Splitters(Recursive·Markdown·Character·Token·semantic-lite·hybrid). config.chunkStrategy·chunkSize·chunkOverlap·prompt. embed는 임베딩 시뮬레이션.',
  },
  {
    id: 'rag_semantic_fetch',
    name: 'RAG 시맨틱 검색',
    description:
      'retrieve·vector 노드: 사용자 질문(또는 상류 텍스트)과 유사한 청크 검색. vector_retrieval과 구분해, 질의→검색된 context를 하류 agent에 넘기는 단계에 사용합니다.',
  },
  {
    id: 'rag_grounded_answer',
    name: 'RAG 근거 답변',
    description:
      'retrieve/vector 뒤에 오는 agent: 검색 컨텍스트만 근거로 답하도록 systemInstruction을 구성. nlp 스킬과 병행; 환각 줄이기 패턴.',
  },
  {
    id: 'code_editor_flow',
    name: '코드 에디터·Flow 연동',
    description:
      'Project/agents·tools·mcp·storage 아래 노드와 매칭된 .py에 저장한 내용이 시뮬레이션 시 해당 노드에 주입됩니다(에이전트 system·RAG 프롬프트·tool 맥락 등). 브라우저는 Python을 직접 실행하지 않으며, API 키는 저장소 루트 .env.example 샘플을 참고해 로컬 .env에만 설정합니다.',
  },
];

/** AI 빌더(Gemini) 시스템 프롬프트에 넣을 스킬 블록 — SKILLS_REGISTRY 단일 출처 */
export const getSkillsPromptBlock = (): string =>
  SKILLS_REGISTRY.map((s) => `- ${s.id}: ${s.name} — ${s.description}`).join('\n');

export const MODEL_REGISTRY: RegistryItem[] = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', desc: '빠르고 효율적인 기본 모델', color: 'text-emerald-400' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', desc: '복잡한 추론 및 코딩 최적화', color: 'text-indigo-400' },
  { id: 'gemini-2.5-flash-image', name: 'Gemini Image', desc: '이미지 생성 및 분석 전용', color: 'text-pink-400' },
];

export const TOOL_REGISTRY: RegistryItem[] = [
  { id: 'google_search', name: 'Google Search', desc: '실시간 웹 정보 검색', icon: Search, color: 'text-blue-400' },
  { id: 'tavily_search', name: 'Tavily Search', desc: 'AI 최적화 웹 검색 및 스크래핑', icon: Search, color: 'text-emerald-500' },
  { id: 'calculator', name: 'Calculator', desc: '정밀한 수학 연산 수행', icon: Cpu, color: 'text-orange-400' },
  { id: 'mcp_weather', name: 'Weather (MCP)', desc: '실시간 날씨 정보 API', icon: Zap, color: 'text-yellow-400' },
  { id: 'mcp_browser', name: 'Web Browser (MCP)', desc: '웹사이트 콘텐츠 추출', icon: Layout, color: 'text-purple-400' },
  { id: 'ingest', name: 'Document Ingest', desc: '문서 가져오기', icon: FileText, color: 'text-indigo-500' },
  { id: 'chunk', name: 'Chunking', desc: '문서 청킹', icon: GitBranch, color: 'text-indigo-500' },
  { id: 'embed', name: 'Embedding', desc: '벡터 임베딩 생성', icon: Cpu, color: 'text-indigo-500' },
  { id: 'retrieve', name: 'Retrieval', desc: '벡터 DB 검색', icon: Search, color: 'text-indigo-500' },
  { id: 'csv_to_postgres_load', name: 'CSV -> PostgreSQL 적재용', desc: 'CSV 파일을 PostgreSQL에 적재하는 도구', icon: Database, color: 'text-blue-400' },
];

export const DATABASE_REGISTRY: RegistryItem[] = [
  { id: 'firestore', name: 'Firestore DB', desc: 'NoSQL 문서 저장소', icon: Database, color: 'text-orange-500' },
  { id: 'mongodb', name: 'MongoDB', desc: '유연한 스키마의 문서 지향 DB', icon: Database, color: 'text-emerald-500' },
  { id: 'postgresql', name: 'PostgreSQL', desc: '강력한 오픈소스 관계형 DB', icon: Database, color: 'text-blue-400' },
  { id: 'redis', name: 'Redis', desc: '고성능 인메모리 데이터 구조 저장소', icon: Zap, color: 'text-red-500' },
];

export const VECTOR_REGISTRY: RegistryItem[] = [
  { id: 'vector_db', name: 'Vector DB', desc: '시맨틱 검색용 벡터 저장소', icon: HardDrive, color: 'text-blue-500' },
  { id: 'pinecone', name: 'Pinecone', desc: '완전 관리형 벡터 데이터베이스', icon: Search, color: 'text-indigo-400' },
  { id: 'chromadb', name: 'ChromaDB', desc: 'AI 애플리케이션용 오픈소스 벡터 DB', icon: Box, color: 'text-indigo-500' },
  { id: 'faiss', name: 'FAISS', desc: 'Meta의 효율적인 유사도 검색 라이브러리', icon: Zap, color: 'text-yellow-500' },
  { id: 'qdrant', name: 'Qdrant', desc: '고성능 벡터 검색 엔진', icon: GitBranch, color: 'text-rose-400' },
];

export const STORAGE_REGISTRY: RegistryItem[] = [
  { id: 'local_storage', name: 'Local Cache', desc: '브라우저 로컬 저장소', icon: Box, color: 'text-gray-400' },
  { id: 's3', name: 'AWS S3', desc: '확장 가능한 클라우드 객체 저장소', icon: HardDrive, color: 'text-orange-400' },
  { id: 'google_cloud_storage', name: 'GCS', desc: 'Google Cloud의 객체 저장소', icon: HardDrive, color: 'text-blue-400' },
];

export const MCP_REGISTRY: RegistryItem[] = [
  { id: 'mcp_weather', name: 'Weather Server', desc: '실시간 날씨 데이터 제공', icon: Zap, color: 'text-yellow-400' },
  { id: 'mcp_browser', name: 'Browser Server', desc: '웹 자동화 및 데이터 추출', icon: Layout, color: 'text-purple-400' },
  { id: 'mcp_filesystem', name: 'Filesystem Server', desc: '로컬 파일 시스템 접근', icon: Folder, color: 'text-blue-400' },
  { id: 'mcp_github', name: 'GitHub Server', desc: 'GitHub API 연동 및 관리', icon: Code, color: 'text-white' },
];

export const INITIAL_GRAPH: WorkflowGraph = {
  nodes: [
    { id: 'start', label: '시작', type: 'start' },
    { id: 'agent1', label: '리서치 에이전트', type: 'agent', description: '정보를 검색합니다' },
    { id: 'tool1', label: '검색 도구', type: 'tool' },
    { id: 'tool2', label: '계산기', type: 'tool' },
    { id: 'vectordb1', label: '지식 베이스', type: 'vector', config: { storageType: 'vector_db', query: 'agent framework' } },
    { id: 'router', label: '품질 검사', type: 'router' },
    { id: 'end', label: '종료', type: 'end' },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'agent1' },
    { id: 'e2', source: 'agent1', target: 'tool1' },
    { id: 'e3', source: 'agent1', target: 'tool2' },
    { id: 'e4', source: 'tool1', target: 'agent1' },
    { id: 'e5', source: 'tool2', target: 'agent1' },
    { id: 'e-v1', source: 'agent1', target: 'vectordb1' },
    { id: 'e-v2', source: 'vectordb1', target: 'agent1' },
    { id: 'e6', source: 'agent1', target: 'router' },
    { id: 'e7', source: 'router', target: 'end', label: '통과', logic: 'return state["score"] > 0.8' },
    { id: 'e8', source: 'router', target: 'agent1', label: '실패', logic: 'return state["score"] <= 0.8' },
  ]
};

export const CODE_SNIPPETS: Record<string, string> = {
  'gemini-3-flash-preview': `import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY" });
const model = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });

async function generate(prompt) {
  const result = await model.generateContent(prompt);
  return result.response.text();
}`,
  'opensearch': `from opensearchpy import OpenSearch

client = OpenSearch(
    hosts=[{'host': 'localhost', 'port': 9200}],
    http_auth=('admin', 'admin'),
    use_ssl=True,
    verify_certs=False,
    ssl_assert_hostname=False,
    ssl_show_warn=False
)

def search_vector(index_name, vector):
    query = {
        "size": 5,
        "query": {
            "knn": {
                "embedding": {
                    "vector": vector,
                    "k": 5
                }
            }
        }
    }
    return client.search(index=index_name, body=query)`,
  'chromadb': `import chromadb

client = chromadb.Client()
collection = client.create_collection(name="my_collection")

def query_chroma(text):
    results = collection.query(
        query_texts=[text],
        n_results=2
    )
    return results`,
  'faiss': `import faiss
import numpy as np

d = 64                           # dimension
nb = 100000                      # database size
nq = 10000                       # nb of queries
xb = np.random.random((nb, d)).astype('float32')
xq = np.random.random((nq, d)).astype('float32')

index = faiss.IndexFlatL2(d)   # build the index
index.add(xb)                  # add vectors to the index

def search_faiss(query_vector):
    D, I = index.search(query_vector, k=4) # search
    return I`,
  'mcp_weather': `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "weather-server",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {
      get_weather: {
        description: "Get current weather for a city",
        parameters: {
          type: "object",
          properties: {
            city: { type: "string" }
          }
        }
      }
    }
  }
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_weather") {
    return { content: [{ type: "text", text: "Sunny, 25°C" }] };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);`,
  'mcp_github': `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const server = new Server({
  name: "github-mcp",
  version: "1.0.0"
}, {
  capabilities: {
    resources: {
      "repo-info": { uri: "github://{owner}/{repo}" }
    }
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources: [{ uri: "github://landai/agentflow", name: "AgentFlow Repo" }] };
});`,
  'mcp_browser': `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { chromium } from "playwright";

const server = new Server({
  name: "browser-mcp",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {
      screenshot: {
        description: "Take a screenshot of a website",
        parameters: {
          type: "object",
          properties: {
            url: { type: "string" }
          }
        }
      }
    }
  }
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "screenshot") {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(request.params.arguments.url);
    const buffer = await page.screenshot();
    await browser.close();
    return { content: [{ type: "image", data: buffer.toString("base64") }] };
  }
});`,
  'firestore': `import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = { /* ... */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function saveData(data) {
  try {
    const docRef = await addDoc(collection(db, "users"), data);
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}`,
};

export const FILE_TREE = [
  { name: 'Project', type: 'folder', children: [
    { name: 'agents', type: 'folder', children: [
      { name: 'researcher.py', type: 'file' },
      { name: 'critic.py', type: 'file' }
    ]},
    { name: 'tools', type: 'folder', children: [
      { name: 'search.py', type: 'file' },
      { name: 'calculator.py', type: 'file' }
    ]},
    { name: 'mcp', type: 'folder', children: [] },
    { name: 'storage', type: 'folder', children: [] },
    { name: 'main.py', type: 'file' },
    { name: 'graph.py', type: 'file' },
    { name: 'requirements.txt', type: 'file' },
    { name: 'README.md', type: 'file' }
  ]}
];
