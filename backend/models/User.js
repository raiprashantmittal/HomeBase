const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    resetOtpHash: { type: String, default: null, select: false },
    resetOtpExpires: { type: Date, default: null, select: false }
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
};

userSchema.methods.checkPassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.setResetOtp = async function (plainOtp) {
  const salt = await bcrypt.genSalt(10);
  this.resetOtpHash = await bcrypt.hash(plainOtp, salt);
  this.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

userSchema.methods.checkResetOtp = async function (plainOtp) {
  if (!this.resetOtpHash || !this.resetOtpExpires) return false;
  if (this.resetOtpExpires < new Date()) return false;
  return bcrypt.compare(plainOtp, this.resetOtpHash);
};

userSchema.methods.clearResetOtp = function () {
  this.resetOtpHash = null;
  this.resetOtpExpires = null;
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    timezone: this.timezone
  };
};

module.exports = mongoose.model('User', userSchema);
