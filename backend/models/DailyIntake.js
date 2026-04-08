import mongoose from 'mongoose';

const dailyIntakeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  grams: {
    type: Number,
    required: true
  },
  calories: {
    type: Number,
    required: true
  },
  sugar: {
    type: Number,
    required: true
  },
  fat: {
    type: Number,
    required: true
  },
  protein: {
    type: Number,
    required: true
  },
  days: {
    type: [String], // Array of strings like ['Monday', 'Tuesday'] or ['Daily']
    required: true
  }
}, { timestamps: true });

const DailyIntake = mongoose.model('DailyIntake', dailyIntakeSchema);
export default DailyIntake;
