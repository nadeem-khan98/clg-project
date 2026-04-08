import WeightLog from '../models/WeightLog.js';
import User from '../models/User.js';

// Helper: normalize date to start of day
const getStartOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const logWeight = async (req, res) => {
  try {
    const { weight } = req.body;

    const startOfDay = getStartOfDay();
    const nextDay = new Date(startOfDay);
    nextDay.setDate(nextDay.getDate() + 1);

    // 🔥 ENSURE ONE ENTRY PER DAY (UPSERT)
    const weightLog = await WeightLog.findOneAndUpdate(
      {
        userId: req.user._id,
        date: { $gte: startOfDay, $lt: nextDay }
      },
      {
        weight,
        date: startOfDay // ✅ FIXED: always same day timestamp
      },
      {
        upsert: true,
        new: true
      }
    );

    // Sync user weight
    await User.findByIdAndUpdate(req.user._id, { weight });

    res.status(200).json(weightLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWeightLogs = async (req, res) => {
  try {
    const logs = await WeightLog.find({ userId: req.user._id })
      .sort({ date: 1 });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};