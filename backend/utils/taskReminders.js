const { sendMail } = require('./mailer');

async function sendTaskReminder(task) {
  const recipients = [task.assignedTo, task.createdBy].filter(
    (u, i, arr) => u && arr.findIndex((x) => x && x.email === u.email) === i
  );
  if (recipients.length === 0) return 0;

  const dueText = task.dueDate
    ? `due ${new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
    : 'with no due date set';

  const results = await Promise.all(
    recipients.map((u) =>
      sendMail({
        to: u.email,
        subject: `Reminder: "${task.title}"`,
        html: `
          <p>Hi ${u.name},</p>
          <p>Just a reminder about this task, ${dueText}:</p>
          <p style="font-size: 16px; font-weight: 600;">${task.title}</p>
          ${task.description ? `<p>${task.description}</p>` : ''}
          <p>Assigned to: ${task.assignedTo ? task.assignedTo.name : 'Unassigned'}</p>
        `
      })
    )
  );
  return results.filter((r) => r.sent).length;
}

module.exports = { sendTaskReminder };