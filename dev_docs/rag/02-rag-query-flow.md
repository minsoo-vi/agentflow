# RAG Flow (질의·답변)

[← RAG 개요](./README.md)

**목적**: 사용자 **질문**을 넣고, **검색된 컨텍스트**만 근거로 에이전트가 답한다. Embedding Flow로 만들어 둔 인덱스를 전제로 한다.

## 권장 노드 순서

`start` (사용자 질문·프롬프트) → `retrieve` 또는 `vector` → `agent` → (`report`) → `end`

- 상류 텍스트가 질의로 `retrieve`/`vector`에 전달되도록 엣지를 연결한다.
- `agent`는 `rag_grounded_answer`로 systemInstruction에 근거 제약을 둔다.

## Embedding Flow와의 관계

- **운영**: 인덱싱 배치(Embedding)와 온라인 질의(RAG)를 **별도 워크플로**로 두는 경우가 많다.
- **단일 그래프**: 한 캔버스에 **위쪽 갈래 = 인덱싱**, **아래쪽 갈래 = 질의**처럼 나눠 그릴 수 있다.

## 연관 스킬

`rag_query_flow`, `rag_semantic_fetch`, `vector_retrieval`, `rag_grounded_answer`, `nlp`

[← Embedding Flow](./01-embedding-flow.md)
