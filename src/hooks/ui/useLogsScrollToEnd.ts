import { useEffect } from 'react';

/** 로그 배열이 바뀔 때마다 `#logs-end` 요소로 스크롤합니다. */
export const useLogsScrollToEnd = (logs: string[]) => {
  useEffect(() => {
    const end = document.getElementById('logs-end');
    if (end) end.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);
};
