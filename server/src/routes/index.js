import { Router } from 'express';
import authRoutes from './auth.js';
import listingsRoutes from './listings.js';
import userRoutes from './users.js';
import volunteerRoutes from './volunteer.js';
import { ImpactStats } from '../models/ImpactStats.js';


const router = Router();

router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'FoodBridge API running'
    });
});

router.use('/auth', authRoutes);
router.use('/listings', listingsRoutes);
router.use('/users', userRoutes);
router.use('/volunteer', volunteerRoutes);

router.get('/impact', async (req, res) => {
  try {
    const stats = await ImpactStats.findOne({}) || 
      { totalMealsSaved: 0, totalKgFoodSaved: 0, totalCO2Saved: 0, totalDeliveries: 0 };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
