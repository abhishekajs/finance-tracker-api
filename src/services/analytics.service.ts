import { PrismaClient, TransactionType } from '@prisma/client';
import {
  SpendingTrend,
  CategoryTrend,
  IncomeVsExpense,
  FinancialSummary,
} from '../models/analytics.model';

const prisma = new PrismaClient();

export class AnalyticsService {
  static async getSpendingTrends(
    userId: string,
    months: number = 12
  ): Promise<SpendingTrend[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    const monthlyData = new Map<string, SpendingTrend>();

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthName,
          year,
          income: 0,
          expenses: 0,
          savings: 0,
          transactionCount: 0,
        });
      }

      const monthData = monthlyData.get(monthKey)!;
      const amount = Number(transaction.amount);

      if (transaction.type === TransactionType.INCOME) {
        monthData.income += amount;
      } else if (transaction.type === TransactionType.EXPENSE) {
        monthData.expenses += amount;
      }

      monthData.transactionCount++;
      monthData.savings = monthData.income - monthData.expenses;
    });

    return Array.from(monthlyData.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (
        new Date(`${a.month} 1, ${a.year}`).getMonth() -
        new Date(`${b.month} 1, ${b.year}`).getMonth()
      );
    });
  }

  static async getCategoryTrends(
    userId: string,
    months: number = 6
  ): Promise<CategoryTrend[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        categoryId: { not: null },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
      orderBy: { date: 'asc' },
    });

    const categoryMap = new Map<string, CategoryTrend>();

    transactions.forEach((transaction) => {
      if (!transaction.category) return;

      const date = new Date(transaction.date);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();

      if (!categoryMap.has(transaction.categoryId!)) {
        categoryMap.set(transaction.categoryId!, {
          categoryId: transaction.categoryId!,
          categoryName: transaction.category.name,
          categoryColor: transaction.category.color,
          categoryIcon: transaction.category.icon,
          monthlyData: [],
          totalAmount: 0,
          averageMonthly: 0,
          trend: 'stable',
        });
      }

      const categoryData = categoryMap.get(transaction.categoryId!)!;
      const amount = Number(transaction.amount);

      let monthData = categoryData.monthlyData.find(
        (m) => m.month === monthName && m.year === year
      );

      if (!monthData) {
        monthData = {
          month: monthName,
          year,
          amount: 0,
          transactionCount: 0,
        };
        categoryData.monthlyData.push(monthData);
      }

      monthData.amount += amount;
      monthData.transactionCount++;
      categoryData.totalAmount += amount;
    });

    return Array.from(categoryMap.values())
      .map((category) => {
        category.averageMonthly = category.totalAmount / months;

        const sortedData = category.monthlyData.sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return (
            new Date(`${a.month} 1, ${a.year}`).getMonth() -
            new Date(`${b.month} 1, ${b.year}`).getMonth()
          );
        });

        if (sortedData.length >= 2) {
          const firstHalf = sortedData.slice(
            0,
            Math.floor(sortedData.length / 2)
          );
          const secondHalf = sortedData.slice(
            Math.floor(sortedData.length / 2)
          );

          const firstAvg =
            firstHalf.reduce((sum, m) => sum + m.amount, 0) / firstHalf.length;
          const secondAvg =
            secondHalf.reduce((sum, m) => sum + m.amount, 0) /
            secondHalf.length;

          const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

          if (changePercent > 10) category.trend = 'increasing';
          else if (changePercent < -10) category.trend = 'decreasing';
          else category.trend = 'stable';
        }

        return category;
      })
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }

  static async getIncomeVsExpense(
    userId: string,
    period: 'monthly' | 'yearly' = 'monthly',
    months: number = 12
  ): Promise<IncomeVsExpense[]> {
    const endDate = new Date();
    const startDate = new Date();

    if (period === 'monthly') {
      startDate.setMonth(startDate.getMonth() - months);
    } else {
      startDate.setFullYear(startDate.getFullYear() - Math.ceil(months / 12));
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    const periodData = new Map<string, IncomeVsExpense>();

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      let periodKey: string;

      if (period === 'monthly') {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        periodKey = date.getFullYear().toString();
      }

      if (!periodData.has(periodKey)) {
        periodData.set(periodKey, {
          period: periodKey,
          income: 0,
          expenses: 0,
          netSavings: 0,
          savingsRate: 0,
        });
      }

      const data = periodData.get(periodKey)!;
      const amount = Number(transaction.amount);

      if (transaction.type === TransactionType.INCOME) {
        data.income += amount;
      } else if (transaction.type === TransactionType.EXPENSE) {
        data.expenses += amount;
      }

      data.netSavings = data.income - data.expenses;
      data.savingsRate =
        data.income > 0 ? (data.netSavings / data.income) * 100 : 0;
    });

    return Array.from(periodData.values()).sort((a, b) =>
      a.period.localeCompare(b.period)
    );
  }

  static async getFinancialSummary(
    userId: string,
    months: number = 12
  ): Promise<FinancialSummary> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
    });

    const totalIncome = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalSavings = totalIncome - totalExpenses;
    const averageMonthlyIncome = totalIncome / months;
    const averageMonthlyExpenses = totalExpenses / months;
    const savingsRate =
      totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

    const categorySpending = new Map<string, number>();
    transactions
      .filter((t) => t.type === TransactionType.EXPENSE && t.categoryId)
      .forEach((t) => {
        const current = categorySpending.get(t.categoryId!) || 0;
        categorySpending.set(t.categoryId!, current + Number(t.amount));
      });

    let topExpenseCategory = 'No categories';
    if (categorySpending.size > 0) {
      const topCategoryId = Array.from(categorySpending.entries()).sort(
        (a, b) => b[1] - a[1]
      )[0][0];
      const category = transactions.find(
        (t) => t.categoryId === topCategoryId
      )?.category;
      topExpenseCategory = category?.name || 'Unknown';
    }

    const monthlyData = new Map<string, { income: number; expenses: number }>();

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthKey = date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { income: 0, expenses: 0 });
      }

      const data = monthlyData.get(monthKey)!;
      const amount = Number(transaction.amount);

      if (transaction.type === TransactionType.INCOME) {
        data.income += amount;
      } else if (transaction.type === TransactionType.EXPENSE) {
        data.expenses += amount;
      }
    });

    const monthlyEntries = Array.from(monthlyData.entries());
    const topIncomeMonth =
      monthlyEntries.length > 0
        ? monthlyEntries.reduce((max, current) =>
            current[1].income > max[1].income ? current : max
          )[0]
        : 'No data';

    const highestExpenseMonth =
      monthlyEntries.length > 0
        ? monthlyEntries.reduce((max, current) =>
            current[1].expenses > max[1].expenses ? current : max
          )[0]
        : 'No data';

    return {
      totalIncome,
      totalExpenses,
      totalSavings,
      averageMonthlyIncome,
      averageMonthlyExpenses,
      savingsRate,
      topExpenseCategory,
      topIncomeMonth,
      highestExpenseMonth,
    };
  }
}
