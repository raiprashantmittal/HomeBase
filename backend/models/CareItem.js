const mongoose = require('mongoose');

const careItemSchema = new mongoose.Schema(
  {
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
    relativeId: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: {
      type: String,
      enum: ['medication', 'appointment', 'status_note', 'checkup'],
      required: true
    },
    title: { type: String, required: true },
    details: { type: String },
    scheduledDate: { type: Date },
    // Embedded snapshot, not a User ref — lets you assign a relative who has no app account,
    // as long as they have an email on file.
    assignedTo: {
      name: { type: String, default: null },
      email: { type: String, default: null }
    },
    reminderSent: { type: Boolean, default: false },
    recurring: {
      isRecurring: { type: Boolean, default: false },
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly', null], default: null }
    },
    status: { type: String, enum: ['upcoming', 'done', 'missed'], default: 'upcoming' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

careItemSchema.index({ familyId: 1, scheduledDate: 1 });
careItemSchema.index({ scheduledDate: 1, reminderSent: 1 });

module.exports = mongoose.model('CareItem', careItemSchema);