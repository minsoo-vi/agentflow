# 한계·알아두기

[← 목차로](./README.md)

- **구조 검증**은 연결성·start/end 수준이다. 의미적으로 잘못된 엣지까지 막지는 않는다.  
- 후처리는 **`router → end` 직결**만 다룬다. 다른 패턴(예: `agent → end`에 report 없음)은 자동 보정하지 않는다.  
- 모델·온도·토큰 등 세부 생성 파라미터는 `generateContent`의 `config`에서 `responseMimeType` 위주로만 제한되어 있다.
