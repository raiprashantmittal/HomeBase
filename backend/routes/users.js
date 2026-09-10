const express = require('express');
const router = express.Router();
const User = require('../models/User');
const requireAuth = require('../middleware/auth');
const Family = require('../models/Family');
const FamilyMember = require('../models/FamilyMember');
const CareItem = require('../models/CareItem');
const LoanItem = require('../models/LoanItem');
const Task = require('../models/Task');
router.use(requireAuth);

// GET /api/users/me
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch profile', details: err.message });
  }
});

// PATCH /api/users/me — edit profile. Requires currentPassword to confirm it's really the user.
router.patch('/me', async (req, res) => {
  try {
    const { currentPassword, name, email, phone, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required to edit your profile' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await user.checkPassword(currentPassword);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (email && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(409).json({ error: 'That email is already in use' });
      user.email = email.toLowerCase();
    }
    if (newPassword) {
      await user.setPassword(newPassword);
    }

    await user.save();
    res.json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ error: 'Could not update profile', details: err.message });
  }
});

// DELETE /api/users/me — permanently delete your account. Requires currentPassword.
router.delete('/me', async (req, res) => {
  try {
    const { currentPassword } = req.body;
    if (!currentPassword) return res.status(400).json({ error: 'Current password is required to delete your account' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await user.checkPassword(currentPassword);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const memberships = await FamilyMember.find({ userId: req.userId });

    for (const membership of memberships) {
      if (membership.role === 'primary_earner') {
        const otherMembers = await FamilyMember.find({
          familyId: membership.familyId,
          userId: { $ne: req.userId }
        });

        if (otherMembers.length === 0) {
          const familyId = membership.familyId;
          await Promise.all([
            Family.findByIdAndDelete(familyId),
            FamilyMember.deleteMany({ familyId }),
            CareItem.deleteMany({ familyId }),
            LoanItem.deleteMany({ familyId }),
            Task.deleteMany({ familyId })
          ]);
        } else {
          const successor = otherMembers[0];
          successor.role = 'primary_earner';
          await successor.save();
        }
      }
    }

    await FamilyMember.deleteMany({ userId: req.userId });
    await User.findByIdAndDelete(req.userId);

    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete account', details: err.message });
  }
});

module.exports = router;
