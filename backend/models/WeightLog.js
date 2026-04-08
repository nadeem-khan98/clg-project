import mongoose from 'mongoose';

const weightLogSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  weight: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const WeightLog = mongoose.model('WeightLog', weightLogSchema);
export default WeightLog;
