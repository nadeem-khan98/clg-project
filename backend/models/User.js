import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  height: { type: Number, required: true }, // cm
  weight: { type: Number, required: true }, // kg
  activityLevel: { 
    type: String, 
    enum: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'],
    required: true
  },
  goal: {
    type: String,
    enum: ['Weight Loss', 'Muscle Gain', 'Maintain Weight'],
    required: true
  },
  diseases: [{
    type: String,
    enum: ['None', 'Diabetes', 'Heart Disease', 'Hypertension', 'Celiac Disease', 'High Cholesterol'],
    default: 'None'
  }]
}, { timestamps: true });

// Pre-save middleware to hash password
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to verify password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
