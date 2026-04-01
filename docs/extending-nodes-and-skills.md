# 노드·스킬 확장 가이드

저장소에 새 노드 타입을 넣어 캔버스·노드 탭에 제대로 보이게 하고, 스킬을 등록하는 방법입니다. 경로는 저장소 루트 기준입니다.

---

## 1. 화면에 노드가 나오게 하기 (UI)

`App.tsx` 기준 메인 UI는 노드 탭(`NodesTabPanel`) + React Flow 캔버스입니다. 
타입을 추가한 뒤 아래를 맞추지 않으면 「그래프 데이터에는 있지만 색만 회색」「드래그 목록에 없음」「노드 상세 아이콘이 비어 있음」 같은 현상이 납니다.

### 1.1 캔버스(React Flow)에 그려지는 조건

- `graph.nodes`에 노드 객체가 있으면 `src/lib/graph/buildReactFlowNodes.tsx`가 React Flow 노드로 변환합니다.
- 색: `src/lib/ui/utils.ts`의 `getNodeColor(type)`. `case`가 없으면 기본 회색(`#6b7280`)입니다.
- 타입 `team`: React Flow에서는 `type: 'group'`, 나머지 워크플로 타입은 RF `type: 'default'`이고 실제 판별은 `data.type`에 둡니다.
- 보조 라벨(라벨 아래 작은 글자): `src/lib/graph/nodeSubLabels.ts`의 `getNodeSubLabel`. 분기가 없으면 빈 문자열이고, 캔버스에는 메인 라벨만 보입니다.
- 초기 위치: 노드에 `position`이 없으면 `workflowGraphLayout.ts`의 레벨 기반 기본 좌표가 쓰입니다.

즉, TypeScript 유니온에 타입만 있고 `getNodeColor`를 안 넣어도 노드 사각형은 뜨지만 색·부가 정보가 기본값입니다.

### 1.2 노드 탭에서 드래그해 캔버스에 놓기

사용자가 노드 탭에서 타일을 드래그해 캔버스에 떨어뜨리는 경로는 다음과 같습니다.

1. `NodesTabPanel` 상단 「드래그하여 노드 추가」 그리드에 `{ type, label, icon, color }` 항목 추가
2. `src/hooks/graph/useWorkflowGraphMutations.ts`의 `onDragStart`가 `application/reactflow`로 타입 문자열 전달 → 캔버스 `onDrop`에서 `createPaletteDroppedNode(type, position)` 호출
3. `src/lib/graph/createPaletteDroppedNode.ts`에 해당 `type`에 대한 `config` 기본값 분기 추가  
   분기가 없으면 `config: {}`인 채로 생성됩니다.

이 세 곳을 빠뜨리면 AI 빌더·JSON 불러오기로는 노드가 생겨도 드래그 목록에서 새 타입을 꺼낼 수 없습니다.

### 1.3 노드 탭 상세 패널(아이콘·설정 폼)

노드를 선택했을 때 오른쪽(또는 패널 안) 노드 상세는 같은 `NodesTabPanel`에서 처리합니다.

- 헤더 아이콘: `activeNode.type === '…'` 분기. 새 타입을 넣지 않으면 아이콘 영역이 비어 보일 수 있습니다.
- 활성 노드 리스트(그리드 아래 목록): 동일하게 `node.type`별 아이콘 분기.
- `config` 편집 UI: `activeNode.type === 'agent'` 같은 블록을 추가하지 않으면, 상세에서 필드가 하나도 없을 수 있습니다. 이 경우 설정은 AI 빌더·JSON·코드 동기화 등으로만 맞춥니다.

RAG 계열(`ingest`, `chunk`, `embed`, `retrieve`) 처리 일부는 `NodeConfigPanel.tsx`에만 있고, 현재 `App` 트리에서는 마운트되지 않을 수 있습니다. 메인 편집 UI는 `NodesTabPanel` 기준으로 보는 것이 맞습니다.

### 1.4 `Sidebar.tsx`의 `NodePalette` (참고)

`src/components/misc/Sidebar.tsx`에 클릭형 NodePalette가 있으나, `App.tsx`에서 import·사용되지 않습니다. 클릭으로 노드를 넣는 UX를 살리려면 상위에서 `onAddNode`로 그래프에 노드를 합치는 배선을 별도로 연결해야 합니다. 지금 기본 플로우는 노드 탭 드래그가 추가 경로입니다.

### 1.5 AI 빌더만으로 그래프에 들어오는 경우

`types.ts`에 타입이 정의돼 있고, Gemini 프롬프트의 허용 `type` 목록(`geminiPrompts.ts`)에 포함되면 JSON이 그래프에 반영되어 캔버스에는 나타납니다. 다만 §1.2·§1.3을 하지 않으면 드래그 추가·상세 폼은 여전히 비어 있을 수 있습니다.

---

## 2. 코드로 노드 타입 추가하기 (전체 체크리스트)

새 `type`을 end-to-end로 넣을 때 권장 순서입니다. §1과 겹치는 항목은 UI 반영용입니다.

| 순서 | 파일 / 위치 | 작업 |
|------|----------------|------|
| 1 | `src/types.ts` | `Node`의 `type` 유니온에 문자열 추가 |
| 2 | `src/lib/graph/createPaletteDroppedNode.ts` | 드롭 시 기본 `label`·`config` 분기 추가 |
| 3 | `src/components/sidebar/NodesTabPanel.tsx` | 「드래그하여 노드 추가」배열 + 노드 상세·리스트의 아이콘 분기 + 필요 시 config 폼 |
| 4 | `src/lib/ui/utils.ts` | `getNodeColor`에 `case` 추가 |
| 5 | `src/lib/graph/nodeSubLabels.ts` | (선택) 캔버스 보조 라벨용 분기 |
| 6 | `src/services/simulation/simulationService.ts` | `executeNode`의 `switch (type)`에 동작 분기 |
| 7 | `src/lib/project/nodeCodePaths.ts` 등 | 코드 탭·ZIP 내보내기 연동 시 경로·스텁 |
| 8 | `src/lib/prompts/geminiPrompts.ts` | AI 빌더가 쓸 수 있도록 허용 `type` 목록에 포함 |
| 9 | `src/lib/graph/buildReactFlowNodes.tsx` | 보통 수정 불필요; `team`처럼 특수 RF 노드 종류가 필요할 때만 |

선택·레거시: `src/components/misc/Sidebar.tsx`의 `NodePalette` — 현재 메인 앱에서 쓰이지 않음(§1.4).

참고 구현: `database`, `datasource`, `chunk`, `router`, `agent` 등.

---

## 3. 스킬(skills) 추가하기

스킬은 노드 메타데이터와 AI 빌더·에이전트 헬퍼 프롬프트에서 같은 ID 목록으로 쓰이도록 `SKILLS_REGISTRY` 한곳에서 정의합니다.

### 3.1 레지스트리에 항목 추가

`src/constants.ts`의 `SKILLS_REGISTRY` 배열에 객체를 추가합니다.

```ts
{
  id: 'my_skill_id',   // 그래프 JSON·nodes[].skills에 그대로 사용; 안정적으로 유지
  name: '표시 이름',
  description: '노드 타입·config와 어떻게 연결되는지, NL 키워드 힌트',
},
```

### 3.2 프롬프트 자동 반영

`getSkillsPromptBlock()`이 `SKILLS_REGISTRY` 전체를 문자열로 붙입니다. AI 빌더·헬퍼에 스킬 목록을 다시 하드코딩할 필요는 없습니다.

다만 특정 시나리오(예: CSV→DB)처럼 언제 어떤 스킬을 붙일지를 NL 생성에 강하게 박아 두려면 `src/lib/prompts/geminiPrompts.ts`의 규칙 문단을 추가·수정하는 것이 좋습니다.

### 3.3 그래프 JSON의 `skills` 필드

AI 빌더 스키마상 노드 루트에 `"skills": ["스킬_id", ...]` 를 둘 수 있습니다. 정의된 ID만 사용합니다(`geminiPrompts.ts`의 JSON 예시 참고).

### 3.4 에이전트 시뮬레이션과의 정합성

`agent` 노드 실행 시 `Agent` 생성자에 넘기는 스킬은 현재 `node.config.skills`를 읽습니다(`simulationService.ts`). 반면 스키마·타입에는 루트 `node.skills` 도 있습니다. AI 출력이 루트에만 `skills`를 두는 경우, 시뮬에서 반영되지 않을 수 있으므로 다음 중 하나를 고려합니다.

- 생성 프롬프트에서 `agent`의 `config` 안에 `skills` 배열을 넣도록 명시하거나
- 그래프 로드·병합 시 `node.skills`를 `config.skills`로 복사하는 정규화 로직을 추가

### 3.5 Cursor·저장소 가이드

에디터 AI가 노드–스킬 매핑을 읽게 하려면 `.cursor/skills/agentflow-workflow/SKILL.md`에 새 스킬 ID와 권장 노드 타입을 짧게 적어 두면 좋습니다.

### 3.6 관련 개발 문서

- [dev_docs/natural-language-workflow/06-skills.md](../dev_docs/natural-language-workflow/06-skills.md) — `SKILLS_REGISTRY` 단일 출처 원칙
- [`.cursor/skills/agentflow-workflow/SKILL.md`](../.cursor/skills/agentflow-workflow/SKILL.md) — 노드 타입별 스킬 요약, RAG·시뮬 규칙

---

## 4. UI에서 스킬을 직접 편집할 때

현재 노드 상세(`NodesTabPanel`)에는 스킬 전용 입력란이 없을 수 있습니다. 스킬은 주로 AI 빌더가 채우거나, 그래프를 JSON 등으로 편집할 때 `skills` / `config.skills`를 맞춥니다. UI에 필드를 추가하려면 `NodesTabPanel`에서 `skills` 배열을 갱신하는 폼을 `setGraph` 또는 노드 단위 업데이트와 연결하면 됩니다.
