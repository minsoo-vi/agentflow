/**
 * 공백을 제거한 뒤 숫자·연산자·괄호만 허용하는 산술식을 파싱합니다.
 * `eval` / `Function` 없이 +, -, *, / 와 괄호를 지원합니다.
 */
export const evaluateSafeArithmeticExpression = (raw: string): number | null => {
  const expr = raw.replace(/\s/g, '');
  if (!expr || !/^[\d+\-*/().]+$/.test(expr)) return null;

  let i = 0;
  const len = expr.length;

  const parseNumber = (): number => {
    let start = i;
    while (i < len && /[0-9.]/.test(expr[i]!)) i += 1;
    if (start === i) throw new Error('parse');
    const n = Number(expr.slice(start, i));
    if (!Number.isFinite(n)) throw new Error('nan');
    return n;
  };

  const parseFactor = (): number => {
    const ch = expr[i];
    if (ch === '(') {
      i += 1;
      const v = parseExpr();
      if (expr[i] !== ')') throw new Error('parse');
      i += 1;
      return v;
    }
    if (ch === '-') {
      i += 1;
      return -parseFactor();
    }
    if (ch === '+') {
      i += 1;
      return parseFactor();
    }
    return parseNumber();
  };

  const parseTerm = (): number => {
    let v = parseFactor();
    while (i < len) {
      const op = expr[i];
      if (op !== '*' && op !== '/') break;
      i += 1;
      const r = parseFactor();
      v = op === '*' ? v * r : v / r;
    }
    return v;
  };

  const parseExpr = (): number => {
    let v = parseTerm();
    while (i < len) {
      const op = expr[i];
      if (op !== '+' && op !== '-') break;
      i += 1;
      const r = parseTerm();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  };

  try {
    const out = parseExpr();
    if (i !== len) return null;
    return Number.isFinite(out) ? out : null;
  } catch {
    return null;
  }
};
