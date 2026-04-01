/** 시뮬 대시보드에 표시하는 단계 한 줄 */
export type SimulationStepRow = {
  nodeId?: string;
  label: string;
  latency: string;
  tokens?: number;
  /** 레거시 시뮬 루프에서만 사용 */
  output?: string;
};

export type SimulationResultsSummary = {
  steps: SimulationStepRow[];
};

/** 글로벌 스토리지: 컬렉션명 → 행 배열 */
export type AgentFlowGlobalDb = Record<string, unknown[]>;

/** executeNode 결과를 노드별로 보관하는 엔트리 */
export type AgentFlowNodeOutputEntry = {
  timestamp: string;
  /** executeNode 반환값 등; 객체·문자열 등 형태가 달라질 수 있음 */
  data: unknown;
  status: 'success' | 'error';
};

/** 노드 ID → 실행 출력 엔트리 */
export type AgentFlowNodeOutputs = Record<string, AgentFlowNodeOutputEntry>;

/** executeNode에 전달하는 입력: text 외 구조화 데이터도 같이 허용 */
export type ExecuteNodeInput = {
  text?: string;
  [key: string]: unknown;
};

/** executeNode 공통 반환 형태 */
export type ExecuteNodeResult = Record<string, unknown> & {
  message: string;
  status: 'success' | 'error';
};