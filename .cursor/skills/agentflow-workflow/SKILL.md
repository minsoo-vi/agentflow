---
name: agentflow-workflow
description: >-
  AgentFlow 워크플로우 에디터의 노드 타입·스킬 ID·시뮬레이션 동작·후처리 규칙.
  이 저장소에서 그래프 생성/시뮬레이션/에이전트 관련 코드를 수정할 때 적용합니다.
---

# AgentFlow 워크플로우 정밀 가이드

## 스킬 카탈로그 (단일 출처)

- 모든 스킬 정의는 `src/constants.ts`의 `SKILLS_REGISTRY`와 `getSkillsPromptBlock()`이 권위입니다.
- AI 빌더(`App.tsx` `handleGenerateFromNL`)는 `getSkillsPromptBlock()`을 삽입해 Gemini에 동일 목록을 전달합니다.
- 노드 JSON의 `skills` 배열에는 **스킬 `id` 문자열**만 넣습니다 (예: `data_import`, `workflow_routing`).

## 노드 타입과 대응 스킬 (요약)

| 노드 타입 | 관련 스킬 id |
|-----------|----------------|
| (코드 탭 동기화) | code_editor_flow |
| datasource | data_import |
| database | database_management |
| datasource → database (CSV 적재) | data_import, database_management, csv_database_load (양 노드에 병행) |
| vector | vector_retrieval |
| storage | storage_persistence |
| mcp | mcp_integration |
| router | workflow_routing |
| report | document_reporting |
| team | team_coordination |
| ingest / chunk / embed (인덱싱 갈래) | rag_embedding_flow, rag_document_load, rag_chunk_embed_index |
| retrieve (질의 갈래) | rag_query_flow, rag_semantic_fetch |
| ingest / chunk / embed / retrieve (통합 힌트) | ingest_pipeline, rag_document_load, rag_chunk_embed_index, rag_semantic_fetch |
| vector (범용 벡터 DB) | vector_retrieval |
| agent (RAG 답변) | rag_query_flow, rag_grounded_answer, nlp |
| agent (작성·비평가 협업) | multi_agent_review, nlp 등 |

## RAG 챗봇: 두 가지 Flow

- **Embedding Flow (`rag_embedding_flow`)**: 문서·규정집 **인덱싱** — `datasource`|`ingest` → `chunk` → `embed` → `storage`|`database`. 사용자 질문은 넣지 않음.
- **RAG Flow (`rag_query_flow`)**: **질의·답변** — `start`(질문) → `retrieve`|`vector` → `agent` → (`report`) → `end`. 인덱스는 Embedding Flow가 전제.
- 한 그래프에 위·아래 갈래로 그리거나, 워크플로를 둘로 나눠도 됨. `dev_docs/rag/` 참고.

## RAG(검색 증강 생성) 구성 요소

- **원문**: `datasource`·`ingest` — 스킬 `data_import`, `rag_document_load`.
- **전처리·인덱스**: `chunk`·`embed`·(선택) `storage` — `rag_chunk_embed_index`, `ingest_pipeline`.
- **청킹(LangChain)**: `chunk` 노드는 `src/lib/simulation/chunkStrategies.ts`에서 `@langchain/textsplitters` 사용. `config.chunkStrategy`: `recursive` | `fixed` | `markdown` | `semantic`(단락 경량) | `hybrid` | `token`; `chunkSize`, `chunkOverlap`.
- **검색**: `retrieve`·`vector` — `rag_semantic_fetch`, `vector_retrieval`.
- **생성**: `agent`가 검색 노드 **다음**에 오도록 연결 — `rag_grounded_answer`로 시스템 지시에 근거 답변을 명시.
- **시뮬**: LangChain 우선 → `rag_op.py` → `src/lib/simulation/ragSimulation.ts` Gemini 폴백. RAG 노드 결과는 `response`로 하류(`ragDownstreamText`).
- **관측(Langfuse)**: 선택. `VITE_LANGFUSE_PUBLIC_KEY`+`SECRET` 설정 시 `src/lib/simulation/langfuseTrace.ts`가 ingest/chunk/embed/retrieve/agent 스팬 기록, `sessionId`=시뮬 run id.

## 코드 에디터 ↔ Flow 시뮬 (`code_editor_flow`)

- `Project/agents`·`tools`·`mcp`·`storage` 아래 노드와 매칭된 `.py`에 **저장만** 해도(`fileContents`), 시뮬 시 `buildEditorCodeByNodeId` → `executeNode`의 `editorCodeByNodeId`로 전달됩니다.
- **브라우저에서는 Python을 직접 실행하지 않습니다.** 로컬 `execSync`가 실패하면 `GEMINI_API_KEY`가 있을 때 에디터 스크립트를 **맥락으로** 넣어 Gemini 시뮬 결과를 반환합니다.
- API 키는 저장소 루트 **`.env.example`에 샘플 이름만** 두고, 실제 값은 로컬 `.env`에만 둡니다.

## 시뮬레이션 (`App.tsx` `runSimulation` + `src/services/simulation/simulationService.executeNode`)

- **lastSubstantiveOutput**: 에이전트·보고서·시작 등의 텍스트만 누적. **router는 덮어쓰지 않음** — 라우터 다음 노드는 이전 단계(예: 비평가) 맥락을 유지합니다.
- **report**: `report_op.py` 우선, 실패 시 Gemini, 최종 폴백 Markdown. `content`·`response`로 하류 전달.
- **router**: 출구 엣지 `label` 목록을 LLM에 제시하고, 응답과 **정규화·부분 매칭**으로 다음 엣지 선택.

## 그래프 후처리

- `src/lib/graph/graphPostprocess.ts` `insertReportBetweenRouterAndEnd`: **router → end** 직접 연결이면 **최종 보고서(report) 노드**를 끼워 넣습니다.

## 엣지 라벨

- 라우터 분기명은 짧은 한글 권장. 시뮬레이션에서 LLM이 해당 문자열을 선택합니다.
- 엣지 라벨 DOM은 `pointer-events: none`으로 캔버스 조작을 가리지 않도록 처리됨.

## 데이터 가져오기

- `DatasourceFileDropzone`: 다중 파일 → `config.importedFiles`. 시뮬에서 **파일 내용이 inlineSample보다 우선**.
- **PDF**: `dataFormat: pdf` 또는 드롭한 파일이 `.pdf`이면 `pdfjs-dist`로 텍스트 추출(`src/lib/documents/pdfText.ts`), 시뮬은 `src/services/simulation/simulationService`의 `datasource` 분기 `format: pdf`.

## CSV → DB 적재 (스킬 `csv_database_load`)

- **의도**: CSV(스프레드시트보내기 포함)를 관계형·문서 DB에 쓰는 파이프라인을 그래프·NL 생성에서 구분해 인식합니다.
- **그래프**: `datasource`(`dataFormat: csv`, `delimiter`, `filePath` 또는 `importedFiles`) → `database`(`operation: write`, `collection`, `storageType`).
- **skills**: `datasource`에 `data_import` + `csv_database_load`, `database`에 `database_management` + `csv_database_load`.
- **정의**: `src/constants.ts`의 `SKILLS_REGISTRY` 항목 `csv_database_load` — AI 빌더는 `getSkillsPromptBlock()`으로 동일 설명을 받습니다.
