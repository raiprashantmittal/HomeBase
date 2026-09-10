const Task = require('../models/Task');
const CareItem = require('../models/CareItem');
const { sendTaskReminder } = require('./taskReminders');
const { sendCareReminder } = require('./careReminders');

const CHECK_INTERVAL_MS = 60 * 1000;
const CARE_REMINDER_LEAD_MS = 30 * 60 * 1000;

async function checkDueTaskReminders() {
  const now = new Date();
  const dueTasks = await Task.find({
    reminderAt: { $lte: now },
    reminderSent: false,
    status: { $ne: 'done' }
  })
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');

  for (const task of dueTasks) {
    await sendTaskReminder(task);
    task.reminderSent = true;
    await task.save();
  }
  return dueTasks.length;
}

async function checkDueCareReminders() {
  const now = new Date();
  const reminderThreshold = new Date(now.getTime() + CARE_REMINDER_LEAD_MS);

  const dueItems = await CareItem.find({
    scheduledDate: { $gte: now, $lte: reminderThreshold },
    reminderSent: false,
    status: 'upcoming'
  }).populate('createdBy', 'name email');

  for (const item of dueItems) {
    await sendCareReminder(item);
    item.reminderSent = true;
    await item.save();
  }
  return dueItems.length;
}

async function checkAllReminders() {
  try {
    const [tasksCount, careCount] = await Promise.all([
      checkDueTaskReminders(),
      checkDueCareReminders()
    ]);
    if (tasksCount > 0) console.log(`[reminders] Sent ${tasksCount} task reminder(s)`);
    if (careCount > 0) console.log(`[reminders] Sent ${careCount} care reminder(s)`);
  } catch (err) {
    console.error('[reminders] Error checking due reminders:', err.message);
  }
}

function startReminderPoller() {
  checkAllReminders();
  setInterval(checkAllReminders, CHECK_INTERVAL_MS);
}

module.exports = { startReminderPoller };