# 동작 흐름 모식도 (Flow)

[← 목차로](./README.md)

아래 다이어그램은 `handleGenerateFromNL` 기준 동작이다. GitHub·VS Code·Cursor 등에서 Mermaid를 렌더링하면 볼 수 있다.

---

## 1. 전체 파이프라인 (사용자 입력 → 캔버스 반영)

```mermaid
flowchart TB
  subgraph UI["브라우저 UI"]
    A[AI 빌더 탭에서 프롬프트 입력·전송]
    B[chatMessages / graph 상태]
  end

  subgraph Build["프롬프트 조립 handleGenerateFromNL"]
    C{chatMessages 비어 있음?}
    C -->|예 신규| D[작업 유형: 새 워크플로우]
    C -->|아니오 수정| E[작업 유형: 기존 그래프 수정]
    E --> F["현재 그래프 JSON.stringify(graph)"]
    D --> G[스킬 블록 getSkillsPromptBlock]
    F --> G
    G --> H[대화 히스토리 + 최신 userMessage]
    H --> I[JSON 스키마·규칙 블록]
  end

  subgraph Gemini["Google GenAI Gemini"]
    J["generateContent responseMimeType: application/json"]
  end

  subgraph Post["클라이언트 후처리"]
    K[JSON.parse → WorkflowGraph]
    L[insertReportBetweenRouterAndEnd]
    M[validateWorkflow]
    N{검증 통과?}
    N -->|실패| O[에러 메시지·graph 미갱신]
    N -->|성공| P[setGraph]
    P --> Q[채팅·history 저장]
    Q --> R[calculateLayout 자동 배치]
  end

  A --> B
  B --> Build
  I --> J
  J --> K
  K --> L --> M --> N
```

---

## 2. 시퀀스 (컴포넌트 간 메시지)

```mermaid
sequenceDiagram
  participant U as 사용자
  participant App as App.tsx
  participant Reg as constants 스킬 블록
  participant G as Gemini API
  participant PP as graphPostprocess
  participant V as validation

  U->>App: 프롬프트 전송
  App->>Reg: 스킬 목록 문자열
  Reg-->>App: 프롬프트 블록
  App->>App: 맥락·그래프·규칙 조립
  App->>G: generateContent JSON
  G-->>App: 그래프 JSON 텍스트
  App->>App: JSON.parse
  App->>PP: insertReportBetweenRouterAndEnd
  PP-->>App: 보정된 그래프
  App->>V: validateWorkflow
  alt 검증 실패
    V-->>App: 오류
    App-->>U: 에러 표시
  else 검증 성공
    V-->>App: OK
    App->>App: setGraph, history, 레이아웃
    App-->>U: 캔버스 갱신
  end
```

---

## 3. 응답 문자열 처리 (한 줄 파이프라인)

```mermaid
flowchart LR
  T[Gemini JSON 문자열]
  P[JSON.parse]
  R[insertReportBetweenRouterAndEnd<br/>router→end 시 report 삽입]
  V[validateWorkflow]
  S[setGraph]
  T --> P --> R --> V --> S
```

---

## 4. 신규 생성 vs 수정 (분기만)

```mermaid
flowchart LR
  S{chatMessages.length}
  S -->|0 첫 전송| N[신규: graph JSON 미포함]
  S -->|1 이상| M[수정: graph 포함·노드 id 유지 지시]
```

---

다음: [개요](./01-overview.md)
