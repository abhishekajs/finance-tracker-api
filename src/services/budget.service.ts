import { PrismaClient, BudgetPeriod, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class BudgetService {
  static async createBudget(
    userId: string,
    data: {
      name: string;
      amount: number;
      period: BudgetPeriod;
      startDate: Date;
      endDate: Date;
      categoryId?: string;
    }
  ) {
    return prisma.budget.create({
      data: {
        name: data.name,
        amount: new Prisma.Decimal(data.amount),
        period: data.period,
        startDate: data.startDate,
        endDate: data.endDate,
        ...(data.categoryId && {
          category: { connect: { id: data.categoryId } },
        }),
        user: { connect: { id: userId } },
      },
      include: {
        category: true,
      },
    });
  }

  static async getUserBudgets(userId: string) {
    return prisma.budget.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
      },
    });
  }

  static async getBudgetById(budgetId: string, userId: string) {
    return prisma.budget.findFirst({
      where: { id: budgetId, userId },
      include: {
        category: true,
      },
    });
  }

  static async updateBudget(
    budgetId: string,
    userId: string,
    data: {
      name?: string;
      amount?: number;
      period?: BudgetPeriod;
      startDate?: Date;
      endDate?: Date;
      categoryId?: string;
    }
  ) {
    return prisma.budget.update({
      where: { id: budgetId, userId },
      data,
      include: {
        category: true,
      },
    });
  }

  static async deleteBudget(budgetId: string, userId: string) {
    return prisma.budget.delete({
      where: { id: budgetId, userId },
    });
  }

  static async getBudgetAnalytics(userId: string) {
    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: {
        category: true,
      },
    });

    const budgetAnalytics = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await this.calculateBudgetSpent(budget.id, userId);
        const remaining = Number(budget.amount) - spent;
        const percentage =
          Number(budget.amount) > 0 ? (spent / Number(budget.amount)) * 100 : 0;

        return {
          ...budget,
          spent,
          remaining,
          percentage: Math.min(percentage, 100),
          status:
            percentage >= 100
              ? 'EXCEEDED'
              : percentage >= 80
                ? 'WARNING'
                : 'ON_TRACK',
        };
      })
    );

    return budgetAnalytics;
  }

  static async calculateBudgetSpent(budgetId: string, userId: string) {
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!budget) return 0;

    const whereClause: Prisma.TransactionWhereInput = {
      userId,
      type: 'EXPENSE',
      date: {
        gte: budget.startDate,
        lte: budget.endDate,
      },
    };

    if (budget.categoryId) {
      whereClause.categoryId = budget.categoryId;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
    });

    return transactions.reduce(
      (total, transaction) => total + Number(transaction.amount),
      0
    );
  }

  static async getActiveBudgets(userId: string) {
    const now = new Date();

    return prisma.budget.findMany({
      where: {
        userId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        category: true,
      },
    });
  }
}
