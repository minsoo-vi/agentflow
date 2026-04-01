# 응답 처리 파이프라인

[← 목차로](./README.md)

```
Gemini JSON 텍스트
  → JSON.parse → WorkflowGraph
  → insertReportBetweenRouterAndEnd(parsed)
  → validateWorkflow(withReport)
  → 실패 시 예외, 성공 시 setGraph(withReport)
```

## 후처리 `insertReportBetweenRouterAndEnd`

모델이 실수로 **`router`에서 `end`로 직접 연결**한 경우를 보완한다.

- 해당 엣지를 제거하고, 중간에 `type: report`, 라벨은「최종 보고서」인 노드를 삽입한다.
- 원래 엣지의 `label` / `logic` / `condition` 은 **router → report** 쪽으로 옮긴다.
- `report → end` 엣지는 빈 `label`로 추가한다.

노드 개수가 늘어났으면 로그에 자동 삽입 안내가 남는다.

## 검증 `validateWorkflow`

- 노드 배열 비어 있으면 실패.  
- `start` / `end` 타입 노드 각각 최소 하나.  
- `start` 제외 모든 노드: 들어오는 엣지 최소 하나.  
- `end` 제외 모든 노드: 나가는 엣지 최소 하나.

실패 시 사용자에게 에러 메시지로 전달되며 그래프는 갱신되지 않는다.

다음: [UI·상태·신규/수정 모드](./05-ui-state-and-modes.md)
