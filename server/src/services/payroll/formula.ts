import { Decimal } from '../../lib/money.js';

export type FormulaContext = {
  variables?: Record<string, Decimal | number | string>;
  rules?: Record<string, Decimal | number | string>;
};

export type ParseError = {
  message: string;
  offset: number;
};

// Token types
type TokenType =
  | 'NUMBER'
  | 'IDENTIFIER'
  | 'RULE_REF'
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'SLASH'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'EOF';

type Token = {
  type: TokenType;
  value: string;
  offset: number;
};

function tokenize(input: string): { tokens: Token[]; errors: ParseError[] } {
  const tokens: Token[] = [];
  const errors: ParseError[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i] ?? '';

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    const startOffset = i;

    // Rule reference: {CODE}
    if (char === '{') {
      i++;
      let code = '';
      while (i < input.length && input[i] !== '}') {
        code += input[i] ?? '';
        i++;
      }
      if (i >= input.length || input[i] !== '}') {
        errors.push({ message: 'Unterminated rule reference', offset: startOffset });
        break;
      }
      i++; // skip '}'
      tokens.push({ type: 'RULE_REF', value: code.trim().toUpperCase(), offset: startOffset });
      continue;
    }

    // Number or Percentage (e.g. 100, 0.5, 20%, 0.75%)
    const nextChar = i + 1 < input.length ? (input[i + 1] ?? '') : '';
    if (/\d/.test(char) || (char === '.' && /\d/.test(nextChar))) {
      let numStr = '';
      while (i < input.length && (/\d/.test(input[i] ?? '') || input[i] === '.')) {
        numStr += input[i] ?? '';
        i++;
      }
      if (i < input.length && input[i] === '%') {
        i++;
        const numVal = new Decimal(numStr).div(100);
        tokens.push({ type: 'NUMBER', value: numVal.toString(), offset: startOffset });
      } else {
        tokens.push({ type: 'NUMBER', value: numStr, offset: startOffset });
      }
      continue;
    }

    // Identifiers or Function names (e.g. CONTRACT_WAGE, min, max, round)
    if (/[a-zA-Z_]/.test(char)) {
      let idStr = '';
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i] ?? '')) {
        idStr += input[i] ?? '';
        i++;
      }
      tokens.push({ type: 'IDENTIFIER', value: idStr, offset: startOffset });
      continue;
    }

    // Operators & Symbols
    if (char === '+') {
      tokens.push({ type: 'PLUS', value: '+', offset: startOffset });
      i++;
      continue;
    }
    if (char === '-') {
      tokens.push({ type: 'MINUS', value: '-', offset: startOffset });
      i++;
      continue;
    }
    if (char === '*') {
      tokens.push({ type: 'STAR', value: '*', offset: startOffset });
      i++;
      continue;
    }
    if (char === '/') {
      tokens.push({ type: 'SLASH', value: '/', offset: startOffset });
      i++;
      continue;
    }
    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(', offset: startOffset });
      i++;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')', offset: startOffset });
      i++;
      continue;
    }
    if (char === ',') {
      tokens.push({ type: 'COMMA', value: ',', offset: startOffset });
      i++;
      continue;
    }

    errors.push({ message: `Unexpected character '${char}'`, offset: startOffset });
    i++;
  }

  tokens.push({ type: 'EOF', value: '', offset: i });
  return { tokens, errors };
}

// AST Nodes
type ASTNode =
  | { type: 'NUMBER'; value: Decimal }
  | { type: 'RULE_REF'; code: string }
  | { type: 'VARIABLE'; name: string }
  | { type: 'CALL'; funcName: string; args: ASTNode[] }
  | { type: 'BINARY'; operator: '+' | '-' | '*' | '/'; left: ASTNode; right: ASTNode }
  | { type: 'UNARY'; operator: '-'; expr: ASTNode };

class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.current] ?? { type: 'EOF', value: '', offset: this.tokens.length };
  }

  private advance(): Token {
    const token = this.peek();
    if (token.type !== 'EOF') this.current++;
    return token;
  }

  private match(type: TokenType): boolean {
    if (this.peek().type === type) {
      this.advance();
      return true;
    }
    return false;
  }

  private expect(type: TokenType, message: string): Token {
    const token = this.peek();
    if (token.type === type) {
      return this.advance();
    }
    throw { message: `${message}, found '${token.value || token.type}'`, offset: token.offset };
  }

  public parse(): ASTNode {
    const node = this.expression();
    if (this.peek().type !== 'EOF') {
      const token = this.peek();
      throw { message: `Unexpected trailing token '${token.value || token.type}'`, offset: token.offset };
    }
    return node;
  }

  private expression(): ASTNode {
    let expr = this.term();

    while (this.peek().type === 'PLUS' || this.peek().type === 'MINUS') {
      const opToken = this.advance();
      const right = this.term();
      expr = {
        type: 'BINARY',
        operator: opToken.type === 'PLUS' ? '+' : '-',
        left: expr,
        right,
      };
    }

    return expr;
  }

  private term(): ASTNode {
    let expr = this.factor();

    while (this.peek().type === 'STAR' || this.peek().type === 'SLASH') {
      const opToken = this.advance();
      const right = this.factor();
      expr = {
        type: 'BINARY',
        operator: opToken.type === 'STAR' ? '*' : '/',
        left: expr,
        right,
      };
    }

    return expr;
  }

  private factor(): ASTNode {
    if (this.match('MINUS')) {
      const expr = this.factor();
      return { type: 'UNARY', operator: '-', expr };
    }
    if (this.match('PLUS')) {
      return this.factor();
    }
    return this.primary();
  }

  private primary(): ASTNode {
    const token = this.peek();

    if (this.match('NUMBER')) {
      return { type: 'NUMBER', value: new Decimal(token.value) };
    }

    if (this.match('RULE_REF')) {
      return { type: 'RULE_REF', code: token.value };
    }

    if (this.match('IDENTIFIER')) {
      const name = token.value;
      if (this.match('LPAREN')) {
        const args: ASTNode[] = [];
        if (this.peek().type !== 'RPAREN') {
          args.push(this.expression());
          while (this.match('COMMA')) {
            args.push(this.expression());
          }
        }
        this.expect('RPAREN', "Expected ')' after function arguments");
        return { type: 'CALL', funcName: name.toLowerCase(), args };
      }
      return { type: 'VARIABLE', name: name.toUpperCase() };
    }

    if (this.match('LPAREN')) {
      const expr = this.expression();
      this.expect('RPAREN', "Expected ')' after expression");
      return expr;
    }

    throw { message: `Unexpected token '${token.value || token.type}'`, offset: token.offset };
  }
}

function evaluateAST(node: ASTNode, context: FormulaContext): Decimal {
  switch (node.type) {
    case 'NUMBER':
      return node.value;

    case 'RULE_REF': {
      const val = context.rules?.[node.code] ?? context.rules?.[node.code.toUpperCase()];
      if (val === undefined || val === null) return new Decimal(0);
      return new Decimal(val);
    }

    case 'VARIABLE': {
      const val = context.variables?.[node.name] ?? context.variables?.[node.name.toUpperCase()];
      if (val === undefined || val === null) return new Decimal(0);
      return new Decimal(val);
    }

    case 'UNARY': {
      const val = evaluateAST(node.expr, context);
      return val.negated();
    }

    case 'BINARY': {
      const left = evaluateAST(node.left, context);
      const right = evaluateAST(node.right, context);
      if (node.operator === '+') return left.add(right);
      if (node.operator === '-') return left.sub(right);
      if (node.operator === '*') return left.mul(right);
      if (node.operator === '/') {
        if (right.isZero()) return new Decimal(0);
        return left.div(right);
      }
      return new Decimal(0);
    }

    case 'CALL': {
      const evaluatedArgs = node.args.map((arg) => evaluateAST(arg, context));
      const fn = node.funcName;

      if (fn === 'min') {
        if (evaluatedArgs.length === 0) return new Decimal(0);
        return Decimal.min(...evaluatedArgs);
      }
      if (fn === 'max') {
        if (evaluatedArgs.length === 0) return new Decimal(0);
        return Decimal.max(...evaluatedArgs);
      }
      if (fn === 'round') {
        if (evaluatedArgs.length === 0) return new Decimal(0);
        const val = evaluatedArgs[0]!;
        const places = evaluatedArgs.length > 1 ? evaluatedArgs[1]!.toNumber() : 2;
        return val.toDecimalPlaces(places, Decimal.ROUND_HALF_UP);
      }
      throw { message: `Unknown function '${fn}'`, offset: 0 };
    }
  }
}

function collectRuleRefs(node: ASTNode, refs: Set<string>): void {
  switch (node.type) {
    case 'RULE_REF':
      refs.add(node.code);
      break;
    case 'UNARY':
      collectRuleRefs(node.expr, refs);
      break;
    case 'BINARY':
      collectRuleRefs(node.left, refs);
      collectRuleRefs(node.right, refs);
      break;
    case 'CALL':
      node.args.forEach((arg) => collectRuleRefs(arg, refs));
      break;
  }
}

/**
 * Validates a formula string for syntax errors and rule sequence constraints.
 */
export function validateFormula(
  formula: string,
  currentRuleSequence?: number,
  ruleSequenceMap?: Map<string, number>,
): { valid: boolean; error?: string; offset?: number } {
  if (!formula || formula.trim() === '') {
    return { valid: false, error: 'Formula cannot be empty' };
  }

  const { tokens, errors } = tokenize(formula);
  if (errors.length > 0 && errors[0]) {
    return { valid: false, error: errors[0].message, offset: errors[0].offset };
  }

  try {
    const parser = new Parser(tokens);
    const ast = parser.parse();

    if (currentRuleSequence !== undefined && ruleSequenceMap) {
      const refs = new Set<string>();
      collectRuleRefs(ast, refs);

      for (const refCode of refs) {
        const seq = ruleSequenceMap.get(refCode);
        if (seq !== undefined && seq >= currentRuleSequence) {
          return {
            valid: false,
            error: `Rule '{${refCode}}' has sequence ${seq} which is >= current rule sequence ${currentRuleSequence}`,
          };
        }
      }
    }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Syntax error', offset: err.offset ?? 0 };
  }
}

/**
 * Evaluates a formula and returns Decimal result.
 */
export function evaluateFormula(formula: string, context: FormulaContext = {}): Decimal {
  const { tokens, errors } = tokenize(formula);
  if (errors.length > 0 && errors[0]) {
    throw new Error(`Formula parse error: ${errors[0].message} at offset ${errors[0].offset}`);
  }

  const parser = new Parser(tokens);
  const ast = parser.parse();
  return evaluateAST(ast, context);
}

/**
 * Evaluates a formula and returns formatted 2-decimal string.
 */
export function evaluateFormulaString(formula: string, context: FormulaContext = {}): string {
  const result = evaluateFormula(formula, context);
  return result.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}
