import { Router } from 'express';
import { TransactionService } from '../services/transaction.service';
import { TransactionType } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get all transactions with pagination and filtering
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const categoryId = req.query.category as string;

    const transactions = await TransactionService.getUserTransactions(
      req.userId!,
      page,
      limit,
      categoryId
    );

    res.json(transactions);
  } catch {
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

// Create transaction
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { amount, description, type, accountId, categoryId, date } = req.body;

    if (!amount || !type || !accountId) {
      return res.status(400).json({
        message: 'Amount, type, and accountId are required',
      });
    }

    const transaction = await TransactionService.createTransaction(
      req.userId!,
      parseFloat(amount),
      description || '',
      type as TransactionType,
      accountId,
      categoryId,
      date ? new Date(date) : undefined
    );

    res.status(201).json(transaction);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create transaction';
    res.status(400).json({ error: errorMessage });
  }
});

// Update transaction
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { amount, description, type, accountId, categoryId, date } = req.body;

    const updateData: Partial<{
      amount: number;
      description: string;
      type: TransactionType;
      accountId: string;
      categoryId: string;
      date: Date;
    }> = {};

    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (description !== undefined) updateData.description = description;
    if (type) updateData.type = type;
    if (accountId) updateData.accountId = accountId;
    if (categoryId) updateData.categoryId = categoryId;
    if (date) updateData.date = new Date(date);

    const transaction = await TransactionService.updateTransaction(
      id,
      req.userId!,
      updateData
    );

    res.json(transaction);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update transaction';
    res.status(400).json({ error: errorMessage });
  }
});

// Delete transaction
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await TransactionService.deleteTransaction(id, req.userId!);
    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Failed to delete transaction' });
  }
});

export default router;
