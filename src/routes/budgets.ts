import express from 'express';
import { BudgetService } from '../services/budget.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { BudgetPeriod } from '@prisma/client';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const budgets = await BudgetService.getUserBudgets(req.userId!);
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ message: 'Failed to fetch budgets' });
  }
});

router.get('/analytics', async (req: AuthRequest, res) => {
  try {
    const analytics = await BudgetService.getBudgetAnalytics(req.userId!);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching budget analytics:', error);
    res.status(500).json({ message: 'Failed to fetch budget analytics' });
  }
});

router.get('/active', async (req: AuthRequest, res) => {
  try {
    const budgets = await BudgetService.getActiveBudgets(req.userId!);
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching active budgets:', error);
    res.status(500).json({ message: 'Failed to fetch active budgets' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const budget = await BudgetService.getBudgetById(
      req.params.id,
      req.userId!
    );
    if (!budget) {
      return res.status(400).json({ message: 'Budget not found' });
    }
    res.json(budget);
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ message: 'Failed to fetch budget' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, amount, period, startDate, endDate, categoryId } = req.body;

    if (!name || !amount || !period || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!Object.values(BudgetPeriod).includes(period)) {
      return res.status(400).json({ message: 'Invalid budget period' });
    }

    const budget = await BudgetService.createBudget(req.userId!, {
      name,
      amount: parseFloat(amount),
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      categoryId: categoryId || undefined,
    });

    res.status(201).json(budget);
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ message: 'Failed to create budget' });
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { name, amount, period, startDate, endDate, categoryId } = req.body;
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (period !== undefined) updateData.period = period;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;

    const budget = await BudgetService.updateBudget(
      req.params.id,
      req.userId!,
      updateData
    );

    res.json(budget);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ message: 'Failed to update budget' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await BudgetService.deleteBudget(req.params.id, req.userId!);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ message: 'Failed to delete budget' });
  }
});

export default router;
