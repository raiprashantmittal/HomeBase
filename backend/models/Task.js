const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
    title: { type: String, required: true },
    description: { type: String },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relatedRelativeId: { type: mongoose.Schema.Types.ObjectId, default: null },
    linkedCareItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareItem', default: null },
    linkedLoanItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoanItem', default: null },
    dueDate: { type: Date },
    reminderAt: { type: Date, default: null },
    reminderSent: { type: Boolean, default: false },
    status: { type: String, enum: ['open', 'in_progress', 'done'], default: 'open' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

taskSchema.index({ familyId: 1, dueDate: 1 });
taskSchema.index({ reminderAt: 1, reminderSent: 1 });

module.exports = mongoose.model('Task', taskSchema);