# 성공 시 UI·상태 및 신규 생성 vs 수정

[← 목차로](./README.md)

## 성공 시 UI·상태

- `setGraph(withReport)` 로 캔버스 그래프 갱신.  
- 채팅에 어시스턴트 메시지 추가.  
- `history`에 `{ timestamp, prompt, graph }` 저장.  
- 짧은 지연 후 `calculateLayout(withReport, true)` 로 노드 좌표를 재배치한다.

## 신규 생성 vs 수정

| 구분 | 조건 | 프롬프트 차이 |
|------|------|----------------|
| 신규 | `chatMessages`가 비어 있는 첫 전송 | 현재 그래프 JSON 미포함 |
| 수정 | 이전에 사용자/어시스턴트 메시지가 있음 | `현재 워크플로우 상태: { ... }` 포함, id 유지 지시 |

다음: [스킬과의 관계](./06-skills.md)
