const express = require('express');
const router = express.Router();
const { sendTaskReminder } = require('../utils/taskReminders');

const Task = require('../models/Task');

const requireAuth = require('../middleware/auth');
const requireFamilyMember = require('../middleware/familyAccess');


router.use(requireAuth);

// GET /api/tasks/:familyId
// List all tasks for a family
router.get('/:familyId', requireFamilyMember, async (req, res) => {
  try {
    const tasks = await Task.find({ familyId: req.familyId })
      .populate('assignedTo', 'name email')
      .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({
      error: 'Could not fetch tasks',
      details: err.message
    });
  }
});

// POST /api/tasks
// Create a new task
router.post('/', requireFamilyMember, async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      createdBy: req.userId
    });

    await task.save();

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({
      error: 'Could not create task',
      details: err.message
    });
  }
});

// PATCH /api/tasks/item/:id
// Update a task
router.patch('/item/:id', async (req, res) => {
  try {
    const updates = {
      ...req.body
    };

    if (updates.status === 'done') {
      updates.completedAt = new Date();
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true
      }
    );

    if (!task) {
      return res.status(404).json({
        error: 'Task not found'
      });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({
      error: 'Could not update task',
      details: err.message
    });
  }
});

// POST /api/tasks/item/:id/remind
// Send task reminder
router.post('/item/:id/remind', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({
        error: 'Task not found'
      });
    }

    const emailsSent = await sendTaskReminder(task);

    if (
      emailsSent === 0 &&
      !task.assignedTo &&
      !task.createdBy
    ) {
      return res.status(400).json({
        error:
          'No one to remind — task has no assignee or creator on file'
      });
    }

    res.json({
      message: 'Reminder sent',
      emailsSent
    });
  } catch (err) {
    res.status(500).json({
      error: 'Could not send reminder',
      details: err.message
    });
  }
});

module.exports = router;