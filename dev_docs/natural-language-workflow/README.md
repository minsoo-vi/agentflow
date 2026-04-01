# 자연어 기반 워크플로우 생성

AgentFlow에서 사용자가 자연어로 설명한 요구를 **그래프(JSON)** 로 바꾸는 흐름을 정리한다. 구현 기준은 `src/App.tsx`의 `handleGenerateFromNL` 이다.

API 키는 `process.env.GEMINI_API_KEY` 를 사용한다.

## 동작 Flow 모식도

**[→ 동작 흐름 모식도 (Mermaid)](./00-flow-diagram.md)** — 전체 파이프라인, 시퀀스, 응답 처리, 신규/수정 분기.

## 목차 (모듈)

| # | 문서 | 내용 |
|---|------|------|
| 0 | [동작 흐름 모식도](./00-flow-diagram.md) | Flowchart·시퀀스·파이프라인 다이어그램 |
| 1 | [개요](./01-overview.md) | 전체 단계 요약 |
| 2 | [함수·모듈 역할](./02-modules-and-code.md) | `handleGenerateFromNL`, 스킬, 후처리, 검증 위치 |
| 3 | [프롬프트 컨텍스트](./03-prompt-context.md) | Gemini에 넣는 문자열 구성 |
| 4 | [응답 처리 파이프라인](./04-response-pipeline.md) | JSON 파싱·후처리·검증 |
| 5 | [UI·상태·신규/수정 모드](./05-ui-state-and-modes.md) | 성공 시 동작, 신규 vs 수정 |
| 6 | [스킬과의 관계](./06-skills.md) | `SKILLS_REGISTRY`, `getSkillsPromptBlock` |
| 7 | [한계·알아두기](./07-limitations.md) | 검증 범위, 후처리 한계 |
