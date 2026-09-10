const express = require("express");
const router = express.Router();
const Family = require("../models/Family");
const FamilyMember = require("../models/FamilyMember");
const User = require("../models/User");
const CareItem = require("../models/CareItem");
const LoanItem = require("../models/LoanItem");
const Task = require("../models/Task");
const requireAuth = require("../middleware/auth");
const { sendMail } = require("../utils/mailer");
const { sendRelativeWelcomeEmail } = require("../utils/emailContent");

router.use(requireAuth);

// POST /api/families — create a new family (creator becomes primary_earner)
// Accepts `relatives: [{ name, relation, city?, dateOfBirth? }, ...]` — as many as needed
router.post("/", async (req, res) => {
  try {
    const { name, relatives } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const family = new Family({
      name,
      createdBy: req.userId,
      relatives: relatives || [],
    });
    await family.save();

    await FamilyMember.create({
      userId: req.userId,
      familyId: family._id,
      role: "primary_earner",
    });

    res.status(201).json(family);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Could not create family", details: err.message });
  }
});

// GET /api/families — list families the current user belongs to
router.get("/", async (req, res) => {
  try {
    const memberships = await FamilyMember.find({
      userId: req.userId,
    }).populate("familyId");
    const families = memberships.map((m) => ({
      ...m.familyId.toObject(),
      myRole: m.role,
    }));
    res.json(families);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Could not fetch families", details: err.message });
  }
});

// POST /api/families/join — join a family using an invite code
router.post("/join", async (req, res) => {
  try {
    const { inviteCode, role } = req.body;
    const family = await Family.findOne({ inviteCode });
    if (!family) return res.status(404).json({ error: "Invalid invite code" });

    const existing = await FamilyMember.findOne({
      userId: req.userId,
      familyId: family._id,
    });
    if (existing)
      return res
        .status(409)
        .json({ error: "You are already a member of this family" });

    await FamilyMember.create({
      userId: req.userId,
      familyId: family._id,
      role: role || "sibling",
    });
    res.status(201).json(family);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Could not join family", details: err.message });
  }
});

// POST /api/families/:familyId/relatives — add a relative to a family
router.post("/:familyId/relatives", async (req, res) => {
  try {
    const family = await Family.findById(req.params.familyId);
    if (!family) return res.status(404).json({ error: "Family not found" });
    family.relatives.push(req.body);
    await family.save();
    const newRelative = family.relatives[family.relatives.length - 1];

    if (newRelative.email) {
      const addedBy = await User.findById(req.userId);
      sendRelativeWelcomeEmail({
        toEmail: newRelative.email,
        toName: newRelative.name,
        familyName: family.name,
        relation: newRelative.relation,
        addedByName: addedBy?.name,
      }).catch((err) =>
        console.error("[families] Relative welcome email failed:", err.message),
      );
    }
    res.status(201).json(family);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Could not add relative", details: err.message });
  }
});

// PATCH /api/families/:familyId/relatives/:relativeId — edit a relative
router.patch("/:familyId/relatives/:relativeId", async (req, res) => {
  try {
    const family = await Family.findById(req.params.familyId);
    if (!family) return res.status(404).json({ error: "Family not found" });
    const relative = family.relatives.id(req.params.relativeId);
    if (!relative) return res.status(404).json({ error: "Relative not found" });

    const { name, relation, email, city, dateOfBirth } = req.body;
    if (name !== undefined) relative.name = name;
    if (relation !== undefined) relative.relation = relation;
    if (email !== undefined) relative.email = email;
    if (city !== undefined) relative.city = city;
    if (dateOfBirth !== undefined) relative.dateOfBirth = dateOfBirth;

    await family.save();
    res.json(family);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Could not update relative", details: err.message });
  }
});

// DELETE /api/families/:familyId/relatives/:relativeId — remove a relative
router.delete("/:familyId/relatives/:relativeId", async (req, res) => {
  try {
    const family = await Family.findById(req.params.familyId);
    if (!family) return res.status(404).json({ error: "Family not found" });
    const relative = family.relatives.id(req.params.relativeId);
    if (!relative) return res.status(404).json({ error: "Relative not found" });
    relative.deleteOne();
    await family.save();
    res.json(family);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Could not remove relative", details: err.message });
  }
});

// GET /api/families/:familyId/members — app users in the family (for task-assignment dropdowns)
router.get("/:familyId/members", async (req, res) => {
  try {
    const memberships = await FamilyMember.find({
      familyId: req.params.familyId,
    }).populate("userId", "name email");
    const members = memberships.map((m) => ({
      userId: m.userId._id,
      name: m.userId.name,
      email: m.userId.email,
      role: m.role,
    }));
    res.json(members);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Could not fetch members", details: err.message });
  }
});

// POST /api/families/:familyId/invite — email someone the invite code directly
router.post("/:familyId/invite", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "email is required" });

    const family = await Family.findById(req.params.familyId);
    if (!family) return res.status(404).json({ error: "Family not found" });

    const inviter = await User.findById(req.userId);
    const joinUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/join?code=${family.inviteCode}`;

    const result = await sendMail({
      to: email,
      subject: `${inviter.name} invited you to join "${family.name}" on Homebase`,
      html: `
        <p>${inviter.name} has invited you to join their family space "${family.name}" on Homebase,
        to help coordinate parent care, shared costs, and tasks.</p>
        <p>Your invite code: <strong style="font-size: 18px;">${family.inviteCode}</strong></p>
        <p>Sign up or sign in, then join using this code, or use this link: <a href="${joinUrl}">${joinUrl}</a></p>
      `,
    });

    res.json({
      message: "Invite sent",
      emailSent: result.sent,
      inviteCode: family.inviteCode,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Could not send invite", details: err.message });
  }
});

// DELETE /api/families/:familyId — permanently delete a family and everything in it.
// Only a primary_earner can do this.
router.delete("/:familyId", async (req, res) => {
  try {
    const membership = await FamilyMember.findOne({
      userId: req.userId,
      familyId: req.params.familyId,
    });
    if (!membership)
      return res
        .status(403)
        .json({ error: "You are not a member of this family" });
    if (membership.role !== "primary_earner") {
      return res
        .status(403)
        .json({ error: "Only the primary earner can delete this family" });
    }

    const familyId = req.params.familyId;
    await Promise.all([
      Family.findByIdAndDelete(familyId),
      FamilyMember.deleteMany({ familyId }),
      CareItem.deleteMany({ familyId }),
      LoanItem.deleteMany({ familyId }),
      Task.deleteMany({ familyId }),
    ]);

    res.json({ message: "Family deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Could not delete family", details: err.message });
  }
});

module.exports = router;
