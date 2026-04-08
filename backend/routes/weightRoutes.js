import express from 'express';
import { logWeight, getWeightLogs } from '../controllers/weightController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, logWeight);
router.get('/', protect, getWeightLogs);

export default router;
