const express = require('express');
const router = express.Router();
const LoanItem = require('../models/LoanItem');
const requireAuth = require('../middleware/auth');
const requireFamilyMember = require('../middleware/familyAccess');

router.use(requireAuth);

// GET /api/loan-items/:familyId — list all loan/expense items for a family
router.get('/:familyId', requireFamilyMember, async (req, res) => {
  try {
    const items = await LoanItem.find({ familyId: req.familyId }).sort({ dueDate: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch loan items', details: err.message });
  }
});

// GET /api/loan-items/:familyId/summary — monthly outflow grouped by category
router.get('/:familyId/summary', requireFamilyMember, async (req, res) => {
  try {
    const summary = await LoanItem.aggregate([
      { $match: { familyId: require('mongoose').Types.ObjectId.createFromHexString(req.familyId), frequency: 'monthly' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);
    const totalMonthly = summary.reduce((sum, s) => sum + s.total, 0);
    res.json({ byCategory: summary, totalMonthly });
  } catch (err) {
    res.status(500).json({ error: 'Could not compute summary', details: err.message });
  }
});

// POST /api/loan-items — create a loan/expense item
router.post('/', requireFamilyMember, async (req, res) => {
  try {
    const item = new LoanItem({ ...req.body, ownerId: req.body.ownerId || req.userId });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Could not create loan item', details: err.message });
  }
});

// PATCH /api/loan-items/item/:id — update status (e.g. mark as paid)
router.patch('/item/:id', async (req, res) => {
  try {
    const item = await LoanItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Loan item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Could not update loan item', details: err.message });
  }
});

module.exports = router;
