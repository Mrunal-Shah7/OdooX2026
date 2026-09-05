type PayslipDetail = {
  payslip: {
    employee: { firstName: string; lastName: string };
    periodStart: string;
    periodEnd: string;
    net: string;
    currency: string;
  };
  lines: { ruleName: string; amount: string }[];
};

export function renderPayslipPdf(detail: PayslipDetail): Buffer {
  // TODO: STUB
  const text = [
    'Payslip',
    `${detail.payslip.employee.firstName} ${detail.payslip.employee.lastName}`,
    `${detail.payslip.periodStart} - ${detail.payslip.periodEnd}`,
    `Net: ${detail.payslip.net} ${detail.payslip.currency}`,
  ].join('\n');
  const pdf = `%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n${text}`;
  return Buffer.from(pdf, 'utf-8');
}
