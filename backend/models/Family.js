const mongoose = require('mongoose');
const crypto = require('crypto');

const RELATION_TYPES = [
  'Father', 'Mother', 'Husband', 'Wife', 'Son', 'Daughter',
  'Brother', 'Sister', 'Grandfather', 'Grandmother', 'In-law', 'Other'
];

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    relation: { type: String, enum: RELATION_TYPES, default: 'Other' },
    email: { type: String, trim: true, lowercase: true, default: null },
    city: { type: String },
    dateOfBirth: { type: Date }
  },
  { _id: true }
);

const familySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    inviteCode: { type: String, unique: true, default: () => crypto.randomBytes(4).toString('hex') },
    relatives: [memberSchema]
  },
  { timestamps: true }
);

familySchema.statics.RELATION_TYPES = RELATION_TYPES;

module.exports = mongoose.model('Family', familySchema);