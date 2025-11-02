import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CategoryService {
  static async createCategory(
    userId: string,
    name: string,
    color: string = '#3f51b5',
    icon: string = 'category'
  ) {
    return prisma.category.create({
      data: {
        name,
        color,
        icon,
        userId,
      },
    });
  }

  static async getUserCategories(userId: string) {
    return prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });
  }

  static async updateCategory(
    categoryId: string,
    userId: string,
    data: {
      name?: string;
      color?: string;
      icon?: string;
    }
  ) {
    return prisma.category.update({
      where: { id: categoryId, userId },
      data,
    });
  }

  static async deleteCategory(categoryId: string, userId: string) {
    return prisma.category.delete({
      where: { id: categoryId, userId },
    });
  }

  static async getCategoryById(categoryId: string, userId: string) {
    return prisma.category.findFirst({
      where: { id: categoryId, userId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });
  }

  static async seedDefaultCategories(userId: string) {
    const defaultCategories = [
      { name: 'Food & Dining', color: '#FF6B6B', icon: 'restaurant' },
      { name: 'Transportation', color: '#4ECDC4', icon: 'directions_car' },
      { name: 'Shopping', color: '#45B7D1', icon: 'shopping_cart' },
      { name: 'Entertainment', color: '#96CEB4', icon: 'movie' },
      { name: 'Bills & Utilities', color: '#FFEAA7', icon: 'receipt' },
      { name: 'Healthcare', color: '#DDA0DD', icon: 'local_hospital' },
      { name: 'Salary', color: '#98D8C8', icon: 'work' },
      { name: 'Investment', color: '#F7DC6F', icon: 'trending_up' },
    ];

    const existingCategories = await prisma.category.findMany({
      where: { userId },
      select: { name: true },
    });

    const existingNames = existingCategories.map((cat) => cat.name);

    const categoriesToCreate = defaultCategories.filter(
      (cat) => !existingNames.includes(cat.name)
    );

    if (categoriesToCreate.length === 0) {
      return { count: 0, message: 'All default categories already exists' };
    }

    const result = await prisma.category.createMany({
      data: categoriesToCreate.map((cat) => ({
        ...cat,
        userId,
      })),
    });

    return {
      count: result.count,
      message: `Created ${result.count} new categories`,
    };
  }
}
