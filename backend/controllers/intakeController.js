import DailyIntake from '../models/DailyIntake.js';

export const getIntakes = async (req, res) => {
  try {
    const intakes = await DailyIntake.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(intakes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addOrUpdateIntake = async (req, res) => {
  try {
    const { productName, grams, calories, sugar, fat, protein, days } = req.body;
    
    // Check if product already exists for user
    const existingIntake = await DailyIntake.findOne({ 
      userId: req.user._id, 
      productName 
    });

    if (existingIntake) {
      // ACCUMULATE (SUM) values if user adds more of the identical food
      existingIntake.grams += grams;
      existingIntake.calories += calories;
      existingIntake.sugar += sugar;
      existingIntake.fat += fat;
      existingIntake.protein += protein;
      existingIntake.days = [...new Set([...existingIntake.days, ...days])];
      
      const updatedIntake = await existingIntake.save();
      return res.json(updatedIntake);
    } else {
      // CREATE new
      const intake = await DailyIntake.create({
        userId: req.user._id,
        productName,
        grams,
        calories,
        sugar,
        fat,
        protein,
        days
      });
      return res.status(201).json(intake);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const editIntake = async (req, res) => {
  try {
    const intake = await DailyIntake.findById(req.params.id);

    if (intake && intake.userId.toString() === req.user._id.toString()) {
      intake.grams = req.body.grams || intake.grams;
      intake.calories = req.body.calories || intake.calories;
      intake.sugar = req.body.sugar || intake.sugar;
      intake.fat = req.body.fat || intake.fat;
      intake.protein = req.body.protein || intake.protein;
      intake.days = req.body.days || intake.days;

      const updatedIntake = await intake.save();
      res.json(updatedIntake);
    } else {
      res.status(404).json({ message: 'Intake not found or not authorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteIntake = async (req, res) => {
  try {
    const intake = await DailyIntake.findById(req.params.id);

    if (intake && intake.userId.toString() === req.user._id.toString()) {
      await intake.deleteOne();
      res.json({ message: 'Intake removed' });
    } else {
      res.status(404).json({ message: 'Intake not found or not authorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
