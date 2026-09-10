const express = require('express');
const router = express.Router();
const CareItem = require('../models/CareItem');
const requireAuth = require('../middleware/auth');
const requireFamilyMember = require('../middleware/familyAccess');

router.use(requireAuth);

// GET /api/care-items/:familyId — list all care items for a family
router.get('/:familyId', requireFamilyMember, async (req, res) => {
  try {
    const items = await CareItem.find({ familyId: req.familyId }).sort({ scheduledDate: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch care items', details: err.message });
  }
});

// POST /api/care-items — create a care item
router.post('/', requireFamilyMember, async (req, res) => {
  try {
    const item = new CareItem({ ...req.body, createdBy: req.userId });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Could not create care item', details: err.message });
  }
});

// PATCH /api/care-items/item/:id — update status/details
router.patch('/item/:id', async (req, res) => {
  try {
    const item = await CareItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Care item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Could not update care item', details: err.message });
  }
});

module.exports = router;