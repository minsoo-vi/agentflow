# Embedding Flow (인덱싱)

[← RAG 개요](./README.md)

**목적**: 규정집·문서를 **청크·임베딩·저장**해 검색 가능한 지식베이스를 만든다. 사용자의 **채팅 질문**은 이 경로에 넣지 않는다.

## 권장 노드 순서

`start` → `datasource` / `ingest` → `chunk` → `embed` → `storage` 또는 `database` → `end`

- PDF·CSV 등은 `datasource` + `dataFormat`에 맞게, `rag_document_load`·`data_import`.
- 청킹·크기는 `chunk` 노드의 `chunkStrategy`, `chunkSize`, `chunkOverlap` — `rag_chunk_embed_index`.

## 연관 스킬

`rag_embedding_flow`, `rag_document_load`, `rag_chunk_embed_index`, `ingest_pipeline`(통합 힌트)

다음: [RAG Flow (질의·답변)](./02-rag-query-flow.md)
