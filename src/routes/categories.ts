import { Router } from 'express';
import { CategoryService } from '../services/category.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const categories = await CategoryService.getUserCategories(req.userId!);
    res.json(categories);
  } catch {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, color, icon } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await CategoryService.createCategory(
      req.userId!,
      name,
      color,
      icon
    );

    res.status(201).json(category);
  } catch {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, color, icon } = req.body;

    const category = await CategoryService.updateCategory(
      req.params.id,
      req.userId!,
      { name, icon, color }
    );

    res.json(category);
  } catch {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await CategoryService.deleteCategory(req.params.id, req.userId!);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

router.post('/seed', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await CategoryService.seedDefaultCategories(req.userId!);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to seed categories' });
  }
});

export default router;
