import { Router } from 'express';
import authRoutes from './auth.js';
import listingsRoutes from './listings.js';
import userRoutes from './users.js';


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

export default router;
