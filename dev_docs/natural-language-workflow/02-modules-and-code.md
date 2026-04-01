# 함수·모듈 역할

[← 목차로](./README.md)

| 단계 | 위치 | 역할 |
|------|------|------|
| 생성 요청 | `App.tsx` `handleGenerateFromNL` | 프롬프트 조립, `generateContent` 호출, 파싱 후 그래프 갱신 |
| 스킬 문구 | `constants.ts` `SKILLS_REGISTRY`, `getSkillsPromptBlock()` | 노드 `skills`에 넣을 수 있는 id·설명 목록을 **단일 출처**로 생성 |
| 후처리 | `lib/graphPostprocess.ts` `insertReportBetweenRouterAndEnd` | `router → end` 직접 연결을 `router → report → end` 로 보정 |
| 검증 | `lib/validation.ts` `validateWorkflow` | `start`/`end` 존재, 전 노드 입·출력 엣지 존재 여부 |

다음: [프롬프트 컨텍스트](./03-prompt-context.md)
