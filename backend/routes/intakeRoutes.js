import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { addOrUpdateIntake, getIntakes, deleteIntake, editIntake } from '../controllers/intakeController.js';

const router = express.Router();

router.route('/')
  .get(protect, getIntakes)
  .post(protect, addOrUpdateIntake);

router.route('/:id')
  .put(protect, editIntake)
  .delete(protect, deleteIntake);

export default router;
