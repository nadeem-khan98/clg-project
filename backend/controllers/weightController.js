import WeightLog from '../models/WeightLog.js';
import User from '../models/User.js';

export const logWeight = async (req, res) => {
  try {
    const { weight } = req.body;
    
    // Start and end of today's date dynamically set natively to map one entry per day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let weightLog = await WeightLog.findOne({
      userId: req.user._id,
      date: { $gte: startOfDay, $lt: endOfDay }
    });

    if (weightLog) {
      // Overwrite exact point
      weightLog.weight = weight;
      weightLog.date = Date.now(); // Keeps timestamp fresh
      await weightLog.save();
    } else {
      weightLog = await WeightLog.create({
        userId: req.user._id,
        weight,
        date: Date.now()
      });
    }

    // Feature 6: Auto-sync root node weight scaling to ensure TDEE dynamically recalculates for Profile logic!
    await User.findByIdAndUpdate(req.user._id, { weight: weight });

    res.status(200).json(weightLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWeightLogs = async (req, res) => {
  try {
    const logs = await WeightLog.find({ userId: req.user._id }).sort({ date: 1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
