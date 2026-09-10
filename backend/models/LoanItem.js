const mongoose = require('mongoose');

const loanItemSchema = new mongoose.Schema(
  {
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    relatedRelativeId: { type: mongoose.Schema.Types.ObjectId, default: null }, // optional — which relative this cost is for
    category: {
      type: String,
      enum: ['education_loan', 'medical', 'home_help', 'travel', 'other'],
      required: true
    },
    title: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    frequency: { type: String, enum: ['monthly', 'one_time', 'quarterly'], default: 'monthly' },
    dueDate: { type: Date, required: true },
    isRecurring: { type: Boolean, default: true },
    status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' }
  },
  { timestamps: true }
);

loanItemSchema.index({ familyId: 1, dueDate: 1 });

module.exports = mongoose.model('LoanItem', loanItemSchema);
