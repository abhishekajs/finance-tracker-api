import { Router } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get spending trends
router.get(
  '/spending-trends',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const months = parseInt(req.query.months as string) || 12;
      const trends = await AnalyticsService.getSpendingTrends(
        req.userId!,
        months
      );
      res.json(trends);
    } catch {
      res.status(500).json({ message: 'Failed to fetch spending trends' });
    }
  }
);

// Get category trends
router.get(
  '/category-trends',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const months = parseInt(req.query.months as string) || 6;
      const trends = await AnalyticsService.getCategoryTrends(
        req.userId!,
        months
      );
      res.json(trends);
    } catch {
      res.status(500).json({ message: 'Failed to fetch category trends' });
    }
  }
);

// Get income vs expense comparison
router.get(
  '/income-vs-expense',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const period = (req.query.period as 'monthly' | 'yearly') || 'monthly';
      const months = parseInt(req.query.months as string) || 12;
      const comparison = await AnalyticsService.getIncomeVsExpense(
        req.userId!,
        period,
        months
      );
      res.json(comparison);
    } catch {
      res
        .status(500)
        .json({ message: 'Failed to fetch income vs expense data' });
    }
  }
);

// Get financial summary
router.get('/summary', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const summary = await AnalyticsService.getFinancialSummary(
      req.userId!,
      months
    );
    res.json(summary);
  } catch {
    res.status(500).json({ message: 'Failed to fetch financial summary' });
  }
});

export default router;
