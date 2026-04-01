# Agentflow 설치 가이드

React(Vite) 기반 워크플로 시각화·코드 생성 도구를 로컬에서 실행하기 위한 절차입니다.

## 사전 요구 사항

- Node.js 18 이상 (권장: LTS 20.x 또는 22.x)
- npm (Node.js 설치 시 포함)

버전 확인:

```bash
node -v
npm -v
```

## 설치

1. 저장소 디렉터리로 이동합니다.

   ```bash
   cd agentflow
   ```

2. 의존성을 설치합니다.

   ```bash
   npm install
   ```

## 환경 변수

프로젝트 루트에 `.env` 파일을 두고, 필요한 키를 설정합니다. 템플릿은 `.env.example`을 참고하세요.

| 변수 | 설명 |
|------|------|
| `GEMINI_API_KEY` | Gemini API 호출에 사용됩니다. 워크플로/AI 기능을 쓰려면 설정하는 것이 좋습니다. |
| `TAVILY_API_KEY` | Tavily 검색 API를 사용할 때 필요합니다. |
| `APP_URL` | 배포 URL·자기 참조 링크 등에 사용됩니다. 로컬 개발만 할 때는 비워 두거나 `http://localhost:3000` 등으로 둘 수 있습니다. |

예시:

```bash
cp .env.example .env
```

`.env`를 연 뒤 `GEMINI_API_KEY` 등 실제 값으로 수정합니다.

## 실행

### 개발 서버

```bash
npm run dev
```

기본적으로 http://localhost:3000 에서 접속합니다 (`0.0.0.0` 바인딩으로 동일 네트워크의 다른 기기에서도 접근 가능).

Hot Module Replacement(HMR)를 끄려면:

```bash
DISABLE_HMR=true npm run dev
```

### 프로덕션 빌드

```bash
npm run build
```

결과물은 `dist/` 폴더에 생성됩니다.

### 빌드 결과 미리보기

```bash
npm run preview
```

### 타입 검사

```bash
npm run lint
```

`typescript` 컴파일러(`tsc`)로 타입 오류만 검사합니다.

### 빌드 산출물 정리

```bash
npm run clean
```

`dist/` 폴더를 삭제합니다. Unix 계열 셸 기준이며, Windows에서는 PowerShell 등에서 수동으로 `dist`를 지워도 됩니다.

## 문제 해결

### `npm run lint`에서 `tsc`를 찾을 수 없음

의존성 설치 후에는 프로젝트 로컬의 TypeScript를 사용하세요.

```bash
npx tsc --noEmit
```

### Vite 빌드 시 PostCSS 오류

상위 폴더(예: 사용자 홈 디렉터리)에 잘못된 `postcss.config.*`가 있으면, Vite가 그 설정을 읽어 실패할 수 있습니다. 이 프로젝트 루트에 포함된 `postcss.config.mjs`가 우선 적용되도록 두었습니다. 그래도 문제가 나면 홈의 PostCSS 설정에서 플러그인을 문자열이 아니라 import 한 모듈로 등록했는지 확인하세요.

### 포트 충돌

`package.json`의 `dev` 스크립트는 `--port=3000`을 사용합니다. 3000번이 사용 중이면 해당 프로세스를 종료하거나, 스크립트의 포트 번호를 변경하세요.

---

문서 버전: 프로젝트 `package.json`의 스크립트·의존성과 함께 유지보수하는 것을 권장합니다.
