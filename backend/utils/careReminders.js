const { sendMail } = require('./mailer');

/**
 * Sends a "coming up in 30 minutes" reminder for a care item.
 * `item.assignedTo` is an embedded { name, email } snapshot (may be unset).
 * `item.createdBy` must already be populated with { name, email }.
 */
async function sendCareReminder(item) {
  const recipients = [item.assignedTo, item.createdBy].filter(
    (u, i, arr) => u && u.email && arr.findIndex((x) => x && x.email === u.email) === i
  );
  if (recipients.length === 0) return 0;

  const timeText = new Date(item.scheduledDate).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  });

  const results = await Promise.all(
    recipients.map((u) =>
      sendMail({
        to: u.email,
        subject: `Starting in 30 minutes: ${item.title}`,
        html: `
          <p>Hi ${u.name},</p>
          <p>This is coming up in about 30 minutes, at ${timeText}:</p>
          <p style="font-size: 16px; font-weight: 600;">${item.title}</p>
          <p style="text-transform: capitalize; color: #5b665f;">${item.type.replace('_', ' ')}</p>
          ${item.details ? `<p>${item.details}</p>` : ''}
        `
      })
    )
  );
  return results.filter((r) => r.sent).length;
}

module.exports = { sendCareReminder };