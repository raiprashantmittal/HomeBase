const express = require('express');
const router = express.Router();
const CareItem = require('../models/CareItem');
const LoanItem = require('../models/LoanItem');
const Task = require('../models/Task');
const requireAuth = require('../middleware/auth');
const requireFamilyMember = require('../middleware/familyAccess');

router.use(requireAuth);

// GET /api/dashboard/:familyId — the "one glance" view: what's due soon, across all three
router.get('/:familyId', requireFamilyMember, async (req, res) => {
  try {
    const familyId = req.familyId;
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [upcomingCare, upcomingLoans, openTasks, loanSummary] = await Promise.all([
      CareItem.find({
        familyId,
        status: 'upcoming',
        scheduledDate: { $gte: now, $lte: in7Days }
      }).sort({ scheduledDate: 1 }),

      LoanItem.find({
        familyId,
        status: { $ne: 'paid' },
        dueDate: { $lte: in7Days }
      }).sort({ dueDate: 1 }),

      Task.find({ familyId, status: { $ne: 'done' } })
        .populate('assignedTo', 'name')
        .sort({ dueDate: 1 }),

      LoanItem.aggregate([
        { $match: { familyId: require('mongoose').Types.ObjectId.createFromHexString(familyId), frequency: 'monthly' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      dueThisWeek: {
        care: upcomingCare,
        loans: upcomingLoans
      },
      openTasks,
      monthlyOutflow: loanSummary[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not build dashboard', details: err.message });
  }
});

module.exports = router;
