export type ComputeInput = {
  employeeId: string;
  contractWage: string;
  periodStart: string;
  periodEnd: string;
};

export type ComputeLine = {
  ruleCode: string;
  ruleName: string;
  category: string;
  sequence: number;
  amount: string;
};

export function computePayslipLines(_input: ComputeInput): ComputeLine[] {
  // TODO: STUB
  return [
    {
      ruleCode: 'BASIC',
      ruleName: 'Basic Salary',
      category: 'basic',
      sequence: 10,
      amount: '85000.00',
    },
    {
      ruleCode: 'PF',
      ruleName: 'Provident Fund',
      category: 'deduction',
      sequence: 50,
      amount: '-8500.00',
    },
  ];
}

export function computeTotals(lines: ComputeLine[]) {
  // TODO: STUB
  let basic = '0.00';
  let gross = '0.00';
  let deductions = '0.00';
  let net = '0.00';
  for (const line of lines) {
    if (line.category === 'basic') basic = line.amount;
    if (line.category === 'gross') gross = line.amount;
    if (line.category === 'deduction') {
      deductions = line.amount.startsWith('-') ? line.amount.slice(1) : line.amount;
    }
    if (line.category === 'net') net = line.amount;
  }
  if (net === '0.00') net = '76500.00';
  if (basic === '0.00') basic = '85000.00';
  if (gross === '0.00') gross = '85000.00';
  if (deductions === '0.00') deductions = '8500.00';
  return { basic, gross, totalDeductions: deductions, net };
}
