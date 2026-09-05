import { prisma } from '../../db/client.js';
import { ApiError } from '../../lib/apiError.js';
import { paginationMeta } from '../../lib/pagination.js';

export async function listSalaryStructures(query: { page: number; pageSize: number; q?: string }) {
  const { page, pageSize, q } = query;
  const skip = (page - 1) * pageSize;

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { code: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [total, items] = await Promise.all([
    prisma.salaryStructure.count({ where }),
    prisma.salaryStructure.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            rules: true,
            contracts: true,
          },
        },
      },
    }),
  ]);

  const data = items.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
    active: item.active,
    ruleCount: item._count.rules,
    employeeCount: item._count.contracts,
  }));

  return {
    data,
    meta: paginationMeta(page, pageSize, total),
  };
}

export async function createSalaryStructure(body: { name: string; code: string; active?: boolean }) {
  // Get the default company ID
  const company = await prisma.company.findFirst();
  if (!company) {
    throw ApiError.internal('Company record not found');
  }

  const existingCode = await prisma.salaryStructure.findUnique({
    where: { code: body.code.toUpperCase() },
  });
  if (existingCode) {
    throw ApiError.conflict(`Salary structure with code '${body.code.toUpperCase()}' already exists`);
  }

  const existingName = await prisma.salaryStructure.findUnique({
    where: { name: body.name },
  });
  if (existingName) {
    throw ApiError.conflict(`Salary structure with name '${body.name}' already exists`);
  }

  const created = await prisma.salaryStructure.create({
    data: {
      companyId: company.id,
      name: body.name,
      code: body.code.toUpperCase(),
      active: body.active ?? true,
    },
  });

  return {
    id: created.id,
    name: created.name,
    code: created.code,
    active: created.active,
    ruleCount: 0,
    employeeCount: 0,
  };
}

export async function getSalaryStructure(id: string) {
  const structure = await prisma.salaryStructure.findUnique({
    where: { id },
    include: {
      rules: {
        orderBy: [{ sequence: 'asc' }, { code: 'asc' }],
      },
      _count: {
        select: {
          contracts: true,
        },
      },
    },
  });

  if (!structure) {
    throw ApiError.notFound('Salary structure not found');
  }

  return {
    structure: {
      id: structure.id,
      name: structure.name,
      code: structure.code,
      active: structure.active,
      ruleCount: structure.rules.length,
      employeeCount: structure._count.contracts,
    },
    rules: structure.rules.map((r) => ({
      id: r.id,
      structureId: r.structureId,
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
    })),
  };
}

export async function updateSalaryStructure(
  id: string,
  body: { name?: string; active?: boolean },
) {
  const existing = await prisma.salaryStructure.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Salary structure not found');
  }

  const updated = await prisma.salaryStructure.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      active: body.active ?? existing.active,
    },
    include: {
      _count: {
        select: { rules: true, contracts: true },
      },
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    code: updated.code,
    active: updated.active,
    ruleCount: updated._count.rules,
    employeeCount: updated._count.contracts,
  };
}
