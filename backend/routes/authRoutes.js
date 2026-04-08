import express from 'express';
import { signup, login, getUserProfile, updateUserProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', protect, getUserProfile);
router.get('/me', protect, getUserProfile);
router.put('/update-profile', protect, updateUserProfile);

export default router;
