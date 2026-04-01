# 프롬프트에 들어가는 정보

[← 목차로](./README.md)

다음 문자열이 하나의 `contents` 블록으로 Gemini에 전달된다.

1. **작업 유형**  
   - 첫 요청: 새 워크플로우 생성.  
   - 이후 메시지가 있으면: **기존 워크플로우 수정** 모드로 안내한다.

2. **스킬 목록**  
   - `getSkillsPromptBlock()` 결과를 그대로 삽입한다.  
   - 각 줄은 `- {id}: {name} — {description}` 형태이며, 생성된 노드의 `skills` 배열에는 **이 id 문자열**을 사용하라고 안내한다.

3. **대화 히스토리**  
   - `chatMessages`를 `role: content` 형태로 이어 붙인 문자열.  
   - **같은 턴에 방금 추가한 사용자 메시지**는 이미 배열에 포함된 뒤 `prompt`를 비우므로, 최신 요청은 아래 4번에서도 따로 강조한다.

4. **최신 요청**  
   - 사용자가 이번에 입력한 문장(`userMessage`)을 따옴표로 명시한다.

5. **현재 그래프 (수정 모드일 때만)**  
   - `chatMessages.length > 0` 이면 `JSON.stringify(graph)` 를 컨텍스트로 넣어, 노드 id 유지 등 **수정** 요청을 유도한다.

6. **JSON 스키마 안내**  
   - `nodes[]`: `id`, `type`, `label`, `config`, `skills` 등.  
   - `edges[]`: `id`, `source`, `target`, `label`, `logic` 등.  
   - 허용 노드 타입: `start`, `end`, `agent`, `tool`, `router`, `team`, `database`, `vector`, `mcp`, `report`, `storage`, `datasource` (프롬프트 문자열 기준).

7. **규칙 블록**  
   - 반드시 `start`와 `end`.  
   - DB·파일·ETL 언급 시 `datasource` 및 `data_import` 스킬.  
   - 멀티 에이전트·비평가 시: 작성 → 비평가 → `router` → 통과 분기는 `report` → `end` 등 **패턴 지시**.  
   - 수정 시 기존 노드 id 유지.  
   - `config` 상세화, 스킬 id를 맥락에 맞게 할당.  
   - **JSON만** 출력.

다음: [응답 처리 파이프라인](./04-response-pipeline.md)
