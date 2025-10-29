import { PrismaClient, AccountType } from '@prisma/client';

const prisma = new PrismaClient();

export class AccountService {
  static async createAccount(
    userId: string,
    name: string,
    type: AccountType,
    balance: number
  ) {
    return prisma.account.create({
      data: {
        name,
        type,
        balance,
        userId,
      },
    });
  }

  static async getUserAccounts(userId: string) {
    return prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateAccount(
    accountId: string,
    userId: string,
    data: {
      name?: string;
      type?: AccountType;
      balance?: number;
    }
  ) {
    return prisma.account.update({
      where: { id: accountId, userId },
      data,
    });
  }

  static async deleteAccount(accountId: string, userId: string) {
    return prisma.account.delete({
      where: { id: accountId, userId },
    });
  }

  static async getAccountById(accountId: string, userId: string) {
    return prisma.account.findFirst({
      where: { id: accountId, userId },
    });
  }

  static async getTotalBalance(userId: string) {
    const result = await prisma.account.aggregate({
      where: { userId },
      _sum: { balance: true },
    });
    return result._sum.balance || 0;
  }
}
