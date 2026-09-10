const { sendMail } = require('./mailer');

function featuresOverviewHtml() {
  return `
    <div style="margin: 20px 0; padding: 18px 20px; background: #f6f4ef; border-radius: 10px;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e2723;">What you can do on Homebase:</p>
      <ul style="margin: 0; padding-left: 18px; color: #1e2723; line-height: 1.7;">
        <li><strong>This week</strong> — one view of everything due soon: appointments, bills, and open tasks</li>
        <li><strong>Care</strong> — track medications, appointments, and checkups for each family member, with automatic reminder emails 30 minutes before</li>
        <li><strong>Money</strong> — track education loan EMIs and care costs together, with a monthly outflow summary</li>
        <li><strong>Family & tasks</strong> — add family members, assign tasks to whoever's handling them, and send reminder emails</li>
        <li><strong>Invite anyone</strong> — share an invite code or send an email invite so siblings/spouse can join the same family space</li>
      </ul>
    </div>
  `;
}

async function sendRelativeWelcomeEmail({ toEmail, toName, familyName, relation, addedByName }) {
  return sendMail({
    to: toEmail,
    subject: `Welcome to the ${familyName} family space on Homebase`,
    html: `
      <p>Hi ${toName},</p>
      <p>${addedByName || 'Someone'} added you to <strong>${familyName}</strong>
      on Homebase as their <strong>${relation}</strong>.</p>
      <p>Homebase is where the family keeps track of care, money, and tasks together —
      so nothing falls through the cracks.</p>
      ${featuresOverviewHtml()}
      <p>If tasks or appointments get assigned to you, you'll hear about it by email —
      no account needed unless you want to log in yourself and see everything directly.</p>
    `
  });
}

module.exports = { featuresOverviewHtml, sendRelativeWelcomeEmail };