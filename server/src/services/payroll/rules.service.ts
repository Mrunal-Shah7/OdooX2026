import { prisma } from '../../db/client.js';
import { ApiError } from '../../lib/apiError.js';
import { Decimal } from '../../lib/money.js';
import { paginationMeta } from '../../lib/pagination.js';
import { validateFormula } from './formula.js';

export async function listSalaryRules(query: { page: number; pageSize: number; structureId?: string }) {
  const { page, pageSize, structureId } = query;
  const skip = (page - 1) * pageSize;

  const where = structureId ? { structureId } : {};

  const [total, items] = await Promise.all([
    prisma.salaryRule.count({ where }),
    prisma.salaryRule.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ sequence: 'asc' }, { code: 'asc' }],
      include: {
        structure: {
          select: { id: true, name: true, code: true },
        },
      },
    }),
  ]);

  const data = items.map((r) => ({
    id: r.id,
    structure: r.structure,
    name: r.name,
    code: r.code,
    category: r.category,
    sequence: r.sequence,
    computation: r.computation,
    amount: r.amount ? r.amount.toString() : null,
    percentage: r.percentage ? r.percentage.toString() : null,
    percentageBase: r.percentageBase,
    formula: r.formula,
    active: r.active,
  }));

  return {
    data,
    meta: paginationMeta(page, pageSize, total),
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
  const structure = await prisma.salaryStructure.findUnique({
    where: { id: body.structureId },
    include: { rules: true },
  });

  if (!structure) {
    throw ApiError.notFound('Salary structure not found');
  }

  const codeUpper = body.code.toUpperCase();
  const existingRule = structure.rules.find((r) => r.code === codeUpper);
  if (existingRule) {
    throw ApiError.conflict(`Salary rule with code '${codeUpper}' already exists in structure '${structure.name}'`);
  }

  // Validate formula if formula computation
  if (body.computation === 'formula' && body.formula) {
    const seqMap = new Map<string, number>();
    structure.rules.forEach((r) => seqMap.set(r.code, r.sequence));

    const val = validateFormula(body.formula, body.sequence, seqMap);
    if (!val.valid) {
      throw ApiError.validation(val.error || 'Invalid formula', [
        { field: 'formula', message: val.error || 'Invalid formula' },
      ]);
    }
  }

  const created = await prisma.salaryRule.create({
    data: {
      structureId: body.structureId,
      name: body.name,
      code: codeUpper,
      category: body.category,
      sequence: body.sequence,
      computation: body.computation,
      amount: body.amount ? new Decimal(body.amount) : null,
      percentage: body.percentage ? new Decimal(body.percentage) : null,
      percentageBase: body.percentageBase ?? null,
      formula: body.formula ?? null,
      active: body.active ?? true,
    },
    include: {
      structure: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  return {
    id: created.id,
    structure: created.structure,
    name: created.name,
    code: created.code,
    category: created.category,
    sequence: created.sequence,
    computation: created.computation,
    amount: created.amount ? created.amount.toString() : null,
    percentage: created.percentage ? created.percentage.toString() : null,
    percentageBase: created.percentageBase,
    formula: created.formula,
    active: created.active,
  };
}

export async function getSalaryRule(id: string) {
  const rule = await prisma.salaryRule.findUnique({
    where: { id },
    include: {
      structure: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  if (!rule) {
    throw ApiError.notFound('Salary rule not found');
  }

  return {
    id: rule.id,
    structure: rule.structure,
    name: rule.name,
    code: rule.code,
    category: rule.category,
    sequence: rule.sequence,
    computation: rule.computation,
    amount: rule.amount ? rule.amount.toString() : null,
    percentage: rule.percentage ? rule.percentage.toString() : null,
    percentageBase: rule.percentageBase,
    formula: rule.formula,
    active: rule.active,
  };
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
  const rule = await prisma.salaryRule.findUnique({
    where: { id },
    include: {
      structure: { include: { rules: true } },
    },
  });

  if (!rule) {
    throw ApiError.notFound('Salary rule not found');
  }

  const newComputation = body.computation ?? rule.computation;
  const newFormula = body.formula !== undefined ? body.formula : rule.formula;
  const newSequence = body.sequence ?? rule.sequence;

  if (newComputation === 'formula' && newFormula) {
    const seqMap = new Map<string, number>();
    rule.structure.rules.forEach((r) => {
      if (r.id !== id) seqMap.set(r.code, r.sequence);
    });

    const val = validateFormula(newFormula, newSequence, seqMap);
    if (!val.valid) {
      throw ApiError.validation(val.error || 'Invalid formula', [
        { field: 'formula', message: val.error || 'Invalid formula' },
      ]);
    }
  }

  const updated = await prisma.salaryRule.update({
    where: { id },
    data: {
      name: body.name ?? rule.name,
      category: body.category ?? rule.category,
      sequence: newSequence,
      computation: newComputation,
      amount: body.amount ? new Decimal(body.amount) : rule.amount,
      percentage: body.percentage ? new Decimal(body.percentage) : rule.percentage,
      percentageBase: body.percentageBase !== undefined ? body.percentageBase : rule.percentageBase,
      formula: newFormula,
      active: body.active ?? rule.active,
    },
    include: {
      structure: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  return {
    id: updated.id,
    structure: updated.structure,
    name: updated.name,
    code: updated.code,
    category: updated.category,
    sequence: updated.sequence,
    computation: updated.computation,
    amount: updated.amount ? updated.amount.toString() : null,
    percentage: updated.percentage ? updated.percentage.toString() : null,
    percentageBase: updated.percentageBase,
    formula: updated.formula,
    active: updated.active,
  };
}

export async function deleteSalaryRule(id: string) {
  const rule = await prisma.salaryRule.findUnique({ where: { id } });
  if (!rule) {
    throw ApiError.notFound('Salary rule not found');
  }

  await prisma.salaryRule.delete({ where: { id } });
}
