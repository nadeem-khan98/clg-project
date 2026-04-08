import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { scanProduct } from '../controllers/scanController.js';

const router = express.Router();

router.get('/:barcode', protect, scanProduct);

export default router;
