# 스킬과의 관계

[← 목차로](./README.md)

- 스킬 정의·설명은 **`src/constants.ts`의 `SKILLS_REGISTRY`** 에 한 번만 적는다.  
- AI 빌더 프롬프트는 **`getSkillsPromptBlock()`** 으로 동일 내용을 주입하므로, 스킬 문구를 바꿀 때 앱과 프롬프트가 어긋나지 않는다.  
- 생성된 JSON의 `nodes[].skills` 는 시뮬레이션·에이전트 실행 시 힌트로 쓰이며, 상세 동작은 노드 `type`과 `config` 가 우선이다.

시뮬레이션·노드 타입과 스킬 ID 매핑 등은 `.cursor/skills/agentflow-workflow/SKILL.md` 를 참고한다.

다음: [한계·알아두기](./07-limitations.md)
