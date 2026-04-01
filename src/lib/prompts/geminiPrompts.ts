import { getSkillsPromptBlock } from '../../constants';
import { AGENT_HELPER_REFERENCE } from './agentHelperKnowledge';

type NlWorkflowPromptParams = {
  isRefinement: boolean;
  userMessage: string;
  conversationHistory: string;
  currentGraphContext: string;
};

/** AI 빌더(자연어 → 워크플로 JSON) Gemini 시스템·유저 병합 프롬프트. */
export const buildNlWorkflowGenerationPrompt = ({
  isRefinement,
  userMessage,
  conversationHistory,
  currentGraphContext,
}: NlWorkflowPromptParams): string => `
          사용자의 요청을 바탕으로 에이전트 워크플로우를 JSON 형식으로 생성하거나 수정해주세요.
          ${isRefinement ? '이것은 기존 워크플로우를 수정하는 요청입니다.' : '이것은 새로운 워크플로우를 생성하는 요청입니다.'}
          
          사용 가능한 스킬 목록 (id는 nodes[].skills에 그대로 사용):
          ${getSkillsPromptBlock()}

          대화 히스토리:
          ${conversationHistory}
          
          최신 요청: "${userMessage}"
          ${currentGraphContext}
          
          JSON 형식:
          {
            "nodes": [
              { 
                "id": "string", 
                "type": "start|end|agent|tool|router|team|database|vector|mcp|report|storage|datasource|ingest|chunk|embed|retrieve|python", 
                "label": "string", 
                "config": { ... },
                "skills": ["string"] // 사용 가능한 스킬 중 선택
              }
            ],
            "edges": [
              { "id": "string", "source": "node_id", "target": "node_id", "label": "string", "logic": "string" }
            ]
          }
          
          규칙:
          1. 반드시 'start'와 'end' 노드가 포함되어야 합니다.
          2. 노드 타입은 start, end, agent, tool, router, team, database, vector, mcp, report, storage, datasource, ingest, chunk, embed, retrieve, python 중 하나여야 합니다.
          3. 복잡한 요청의 경우 적절한 router와 logic을 사용하여 조건부 흐름을 만들어주세요.
          4. database, vector, mcp, report, storage, datasource 노드를 적극적으로 활용하여 전문적인 워크플로우를 구성하세요.
          4a. RAG 챗봇·지식베이스는 흐름이 둘로 나뉩니다. (1) Embedding Flow(인덱싱): datasource|ingest → chunk → embed → storage|database — 문서를 넣어 벡터·인덱스를 만듦. 스킬 rag_embedding_flow, rag_document_load, rag_chunk_embed_index. (2) RAG Flow(질의·답변): start(사용자 질문) → retrieve|vector → agent → (report) → end — 질문만 상류로 넣고 검색·근거 답변. 스킬 rag_query_flow, rag_semantic_fetch, rag_grounded_answer. 한 번에 한 그래프로 그릴 수도 있고, 인덱싱과 질의를 시각적으로 두 갈래로 나눠도 됩니다. chunk에는 config.chunkStrategy(recursive|fixed|markdown|semantic|hybrid|token), chunkSize, chunkOverlap을 설정하세요.
          4b. 데이터베이스에 저장·적재·적재(ETL)·CSV/텍스트/PDF 규정집·파일에서 읽기 등이 언급되면 반드시 start 다음(또는 저장 직전)에 datasource 노드를 넣고, config에 dataFormat(csv|text|json|pdf), filePath, 필요 시 inlineSample을 채우세요. PDF·규정집은 dataFormat pdf를 사용합니다. 해당 datasource 노드(또는 이를 다루는 agent)에는 skills에 data_import를 포함하세요.
          4b-csv-db. 사용자가 CSV(또는 스프레드시트/엑셀보내기)를 관계형·문서 DB에 넣는다고 하면: datasource(dataFormat csv, delimiter 등) → database(config.operation write, collection, storageType)로 연결합니다. datasource의 skills에 ["data_import","csv_database_load"], database의 skills에 ["database_management","csv_database_load"]를 포함하세요. (tool 노드 csv_to_postgres_load를 쓰는 설계도 가능하지만, 노드만으로 표현할 때 위 패턴을 우선합니다.)
          4c. 멀티 에이전트, 팀, 비평가·크리틱(Critic)·검토자가 포함된 요청(예: "비평가가 있는 팀", "작성자와 비평가")에는 반드시 아래 구조를 따르세요:
             - 흐름: start → 작성/메인 agent → 비평가 agent → router(최소 2개 출구) → **통과·승인·합격 분기는 반드시 report 노드로만 연결** → report 다음에만 end.
             - 재작성·반려·실패 분기는 작성 agent로 되돌아가게 하세요 (edges에 label과 logic을 명확히).
             - 최종 사용자에게 보여줄 결과물은 항상 report 노드에서 생성합니다. end 앞에 report가 없으면 안 됩니다.
             - report 노드 config: reportFormat은 "markdown" 권장, description에 최종 통합 보고서임을 적으세요.
             - router의 각 출구 edge에 한글 label을 짧게 명시하세요 (예: "통과", "재작성"). 시뮬레이션에서 라우터 LLM이 이 문자열을 그대로 선택합니다.
          5. 수정 요청인 경우, 기존 노드 ID를 최대한 유지하면서 필요한 부분만 변경하세요.
          6. 각 노드의 config를 상세하게 설정해주세요 (예: agent의 model, systemInstruction 등).
          7. 각 노드에 위 스킬 id를 맥락에 맞게 할당하세요(예: datasource→data_import, router→workflow_routing, report→document_reporting, 작성/비평가 에이전트→multi_agent_review, CSV→DB 적재→datasource·database에 csv_database_load).
          8. JSON만 응답해주세요.
        `;

/** 에이전트 헬퍼 패널 Gemini 프롬프트. */
export const buildAgentHelperPrompt = (historyForApi: string): string =>
  `당신은 AgentFlow 앱의 "에이전트 헬퍼"입니다. **사용자가 AgentFlow에서 에이전트(agent 노드·팀·흐름)를 잘 만들도록** 돕는 것이 유일한 목적입니다.

역할:
- 역할 분리·팀 구성·router/team/report 배치, **systemInstruction·description 작성 팁**, **skills id 선택**, RAG/멀티 에이전트에서 agent를 어디에 두면 좋은지 등 **실전 설계 조언**을 한국어로 합니다.
- 필요하면 **systemInstruction 초안 예시**(역할·톤·금지 사항 포함)를 짧게 제시해도 됩니다.

규칙:
- 워크플로 JSON 전체나 그래프 정의를 출력하지 마세요. (자동 생성은 "AI 빌더" 탭)
- 그래프를 한 번에 만들고 싶다면 AI 빌더 탭을 안내하세요.
- 아래 참고 문맥·스킬 목록을 우선하되, **에이전트 품질**(명확한 역할, 환각 줄이기, 분기 일관성) 관점에서 답하세요.
- 답은 문단·불릿으로 읽기 쉽게, 가능하면 **바로 적용할 수 있는 체크리스트·문장**으로 마무리하세요.

### 참고 문맥 (AgentFlow)
${AGENT_HELPER_REFERENCE}

### 스킬 목록
${getSkillsPromptBlock()}

### 대화
${historyForApi}
`;
