import { Router } from 'express';
import { AccountService } from '../services/account.service';
import { AccountType } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get all accounts
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const accounts = await AccountService.getUserAccounts(req.userId!);
    res.json(accounts);
  } catch {
    res.status(500).json({ message: 'Failed to fetch accounts' });
  }
});

// Create account
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, type, balance } = req.body;

    if (!name || !type || balance === undefined) {
      return res.status(400).json({
        message: 'Name, type, and balance are required',
      });
    }

    const account = await AccountService.createAccount(
      req.userId!,
      name,
      type as AccountType,
      parseFloat(balance)
    );

    res.status(201).json(account);
  } catch {
    res.status(500).json({ message: 'Failed to create account' });
  }
});

// Update account
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, type, balance } = req.body;

    const updateData: Partial<{
      name: string;
      type: AccountType;
      balance: number;
    }> = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (balance !== undefined) updateData.balance = parseFloat(balance);

    const account = await AccountService.updateAccount(
      id,
      req.userId!,
      updateData
    );
    res.json(account);
  } catch {
    res.status(500).json({ message: 'Failed to update account' });
  }
});

// Delete account
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await AccountService.deleteAccount(id, req.userId!);
    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

// Get total balance
router.get(
  '/balance/total',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const totalBalance = await AccountService.getTotalBalance(req.userId!);
      res.json({ totalBalance });
    } catch {
      res.status(500).json({ message: 'Failed to get total balance' });
    }
  }
);

export default router;
