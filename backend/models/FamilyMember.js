const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
    role: {
      type: String,
      enum: ['primary_earner', 'sibling', 'spouse', 'other'],
      default: 'other'
    }
  },
  { timestamps: { createdAt: 'joinedAt', updatedAt: false } }
);

// A user can only join a given family once
familyMemberSchema.index({ userId: 1, familyId: 1 }, { unique: true });

module.exports = mongoose.model('FamilyMember', familyMemberSchema);
