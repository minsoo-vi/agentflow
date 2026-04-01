# 개요

[← 목차로](./README.md)

1. 사용자가 **AI 빌더** 탭에서 프롬프트를 입력하고 전송한다.
2. 클라이언트가 **Gemini (GenAI)** 에 시스템 지시와 함께 **대화 맥락·현재 그래프·스킬 목록**을 넣어 호출한다.
3. 응답은 **JSON 한 덩어리**(`responseMimeType: application/json`)로 받는다.
4. 서버가 아닌 브라우저에서 **후처리 → 검증** 후 React state(`graph`)에 반영한다.
5. 선택적으로 **자동 레이아웃**(`calculateLayout`)이 실행된다.

다음: [함수·모듈 역할](./02-modules-and-code.md)
