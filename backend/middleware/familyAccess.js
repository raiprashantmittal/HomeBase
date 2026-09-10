const FamilyMember = require('../models/FamilyMember');

// Checks that req.userId belongs to the family referenced by req.params.familyId
// (or req.body.familyId, whichever is present). Attaches nothing; just blocks or allows.
module.exports = async function requireFamilyMember(req, res, next) {
  const familyId = req.params.familyId || req.body.familyId;
  if (!familyId) {
    return res.status(400).json({ error: 'familyId is required' });
  }

  try {
    const membership = await FamilyMember.findOne({ userId: req.userId, familyId });
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this family' });
    }
    req.familyId = familyId;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Server error checking family membership' });
  }
};
