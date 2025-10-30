import { PrismaClient, TransactionType, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class TransactionService {
  static async createTransaction(
    userId: string,
    amount: number,
    description: string,
    type: TransactionType,
    accountId: string,
    categoryId?: string,
    date?: Date
  ) {
    return prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: { id: accountId, userId },
      });

      if (!account) {
        throw new Error('Account not found or access denied');
      }

      const currentBalance = Number(account.balance);
      let newBalance = currentBalance;

      switch (type) {
        case 'INCOME':
          newBalance = currentBalance + amount;
          break;
        case 'EXPENSE':
          newBalance = currentBalance - amount;
          if (newBalance < 0 && account.type !== 'CREDIT') {
            throw new Error(
              `Insufficient funds. Current balance: ${currentBalance}, Transaction amount: ${amount}`
            );
          }
          break;
        case 'TRANSFER':
          if (newBalance < 0 && account.type !== 'CREDIT') {
            throw new Error(
              `Insufficient funds for transfer. Current balance: ₹${currentBalance}, Transfer amount: ₹${amount}`
            );
          }
          break;
      }

      await tx.account.update({
        where: { id: accountId },
        data: { balance: new Prisma.Decimal(newBalance) },
      });

      const transaction = await tx.transaction.create({
        data: {
          amount: new Prisma.Decimal(amount),
          description,
          type,
          date: date || new Date(),
          accountId,
          categoryId: categoryId || null,
          userId,
        },
        include: {
          account: true,
          category: true,
        },
      });

      return transaction;
    });
  }

  static async updateTransaction(
    transactionId: string,
    userId: string,
    data: {
      amount?: number;
      description?: string;
      type?: TransactionType;
      accountId?: string;
      categoryId?: string;
      date?: Date;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const originalTransaction = await tx.transaction.findFirst({
        where: { id: transactionId, userId },
        include: { account: true },
      });

      if (!originalTransaction) {
        throw new Error('Transaction not found');
      }

      const originalAmount = Number(originalTransaction.amount);
      const currentBalance = Number(originalTransaction.account.balance);
      let revertedBalance = currentBalance;

      switch (originalTransaction.type) {
        case 'INCOME':
          revertedBalance = currentBalance - originalAmount;
          break;
        case 'EXPENSE':
        case 'TRANSFER':
          revertedBalance = currentBalance + originalAmount;
          break;
      }

      const newAmount = data.amount || originalAmount;
      const newType = data.type || originalTransaction.type;
      let finalBalance = revertedBalance;

      switch (newType) {
        case 'INCOME':
          finalBalance = revertedBalance + newAmount;
          break;
        case 'EXPENSE':
        case 'TRANSFER':
          finalBalance = revertedBalance - newAmount;
          if (
            finalBalance < 0 &&
            originalTransaction.account.type !== 'CREDIT'
          ) {
            throw new Error(
              `Insufficient funds. Available balance: ₹${revertedBalance}, Transaction amount: ₹${newAmount}`
            );
          }
          break;
      }

      await tx.account.update({
        where: { id: originalTransaction.accountId },
        data: { balance: new Prisma.Decimal(finalBalance) },
      });

      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId, userId },
        data: {
          ...data,
          amount: data.amount ? new Prisma.Decimal(data.amount) : undefined,
        },
        include: {
          account: true,
          category: true,
        },
      });

      return updatedTransaction;
    });
  }

  static async deleteTransaction(transactionId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: { id: transactionId, userId },
        include: { account: true },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const amount = Number(transaction.amount);
      const currentBalance = Number(transaction.account.balance);
      let newBalance = currentBalance;

      switch (transaction.type) {
        case 'INCOME':
          newBalance = currentBalance - amount;
          break;
        case 'EXPENSE':
        case 'TRANSFER':
          newBalance = currentBalance + amount;
          break;
      }

      await tx.transaction.delete({
        where: { id: transactionId, userId },
      });

      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: new Prisma.Decimal(newBalance) },
      });

      return { message: 'Transaction deleted and balance updated' };
    });
  }

  static async getUserTransactions(
    userId: string,
    page: number = 1,
    limit: number = 50,
    categoryId?: string
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.TransactionWhereInput = { userId };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    return prisma.transaction.findMany({
      where,
      include: {
        account: true,
        category: true,
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    });
  }
}
