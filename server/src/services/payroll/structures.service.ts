import { paginationMeta } from '../../lib/pagination.js';

const stubStructure = {
  id: '77777777-7777-4777-8777-777777777777',
  name: 'India Monthly',
  code: 'IN-MON',
  active: true,
  ruleCount: 5,
  employeeCount: 12,
};

const stubRule = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  structure: { id: '77777777-7777-4777-8777-777777777777', name: 'India Monthly', code: 'IN-MON' },
  name: 'Basic Salary',
  code: 'BASIC',
  category: 'basic' as const,
  sequence: 10,
  computation: 'fixed' as const,
  amount: '85000.00',
  percentage: null,
  percentageBase: null,
  formula: null,
  active: true,
};

export async function listSalaryStructures(query: { page: number; pageSize: number }) {
  // TODO: STUB
  return {
    data: [stubStructure],
    meta: paginationMeta(query.page, query.pageSize, 1),
  };
}

export async function createSalaryStructure(body: { name: string; code: string; active?: boolean }) {
  // TODO: STUB
  return {
    ...stubStructure,
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    name: body.name,
    code: body.code,
    active: body.active ?? true,
    ruleCount: 0,
    employeeCount: 0,
  };
}

export async function getSalaryStructure(id: string) {
  // TODO: STUB
  return {
    structure: { ...stubStructure, id },
    rules: [stubRule],
  };
}

export async function updateSalaryStructure(
  id: string,
  body: { name?: string; active?: boolean },
) {
  // TODO: STUB
  return { ...stubStructure, id, ...body };
}

export async function listSalaryRules(query: { page: number; pageSize: number }) {
  // TODO: STUB
  return {
    data: [stubRule],
    meta: paginationMeta(query.page, query.pageSize, 1),
  };
}

export async function createSalaryRule(body: {
  structureId: string;
  name: string;
  code: string;
  category: 'basic' | 'allowance' | 'gross' | 'deduction' | 'net';
  sequence: number;
  computation: 'fixed' | 'percentage' | 'formula';
  amount?: string;
  percentage?: string | null;
  percentageBase?: 'contract_wage' | 'basic' | 'gross' | null;
  formula?: string | null;
  active?: boolean;
}) {
  // TODO: STUB
  return {
    ...stubRule,
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    structure: { id: body.structureId, name: 'India Monthly', code: 'IN-MON' },
    name: body.name,
    code: body.code,
    category: body.category,
    sequence: body.sequence,
    computation: body.computation,
    amount: body.amount ?? '0.00',
    percentage: body.percentage ?? null,
    percentageBase: body.percentageBase ?? null,
    formula: body.formula ?? null,
    active: body.active ?? true,
  };
}

export async function getSalaryRule(id: string) {
  // TODO: STUB
  return { ...stubRule, id };
}

export async function updateSalaryRule(
  id: string,
  body: Partial<{
    name: string;
    category: 'basic' | 'allowance' | 'gross' | 'deduction' | 'net';
    sequence: number;
    computation: 'fixed' | 'percentage' | 'formula';
    amount: string;
    percentage: string | null;
    percentageBase: 'contract_wage' | 'basic' | 'gross' | null;
    formula: string | null;
    active: boolean;
  }>,
) {
  // TODO: STUB
  return { ...stubRule, id, ...body };
}

export async function deleteSalaryRule(_id: string) {
  // TODO: STUB
}
