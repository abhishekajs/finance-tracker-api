export interface SpendingTrend {
  month: string;
  year: number;
  income: number;
  expenses: number;
  savings: number;
  transactionCount: number;
}

export interface CategoryTrend {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  monthlyData: {
    month: string;
    year: number;
    amount: number;
    transactionCount: number;
  }[];
  totalAmount: number;
  averageMonthly: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface IncomeVsExpense {
  period: string;
  income: number;
  expenses: number;
  netSavings: number;
  savingsRate: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  averageMonthlyIncome: number;
  averageMonthlyExpenses: number;
  savingsRate: number;
  topExpenseCategory: string;
  topIncomeMonth: string;
  highestExpenseMonth: string;
}
