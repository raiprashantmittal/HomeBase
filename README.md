# Homebase — Eldercare + Finance Dashboard

A unified dashboard for sole earners managing aging parents remotely while carrying their own
financial load (education loans, care costs) — with full family coordination built in.

Full stack: **backend** (API) + **frontend** (React dashboard).

## Stack
- Backend: Node.js + Express, MongoDB + Mongoose, JWT auth (bcrypt), Nodemailer for email
- Frontend: React (Vite), React Router, plain CSS with a small design-token system

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
# fill in MONGO_URI, JWT_SECRET, and the EMAIL_* block (see "Email setup" below)
npm run dev
```

Requires a running MongoDB instance (local or MongoDB Atlas free tier). Server starts on
`http://localhost:5000`. Health check: `GET /api/health`

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Opens on `http://localhost:5173`.

## Features

### Accounts & profile
- Sign up / sign in (JWT auth)
- Forgot password — two ways: reset with your old password, or via an emailed 6-digit OTP
- View/edit profile (name, email, phone, password) — any change requires your current password
- Delete account — if you're the sole owner of a family, that family and its data are deleted
  too; if others share it, ownership passes to one of them automatically

### Families & family members
- Create a family, or join one via invite code — the code is always visible in the sidebar
- Add multiple family members (Father, Mother, Husband, Wife, Son, Daughter, Brother, Sister,
  Grandparents, In-law, Other) — add/edit/remove, no limit
- Each family member can optionally have an email on file, so they can be assigned to handle
  care items even without an app account
- Invite a sibling/spouse by email, or share the code directly
- Delete a family entirely (primary earner only) — cascades to all its care items, expenses,
  and tasks

### This week (dashboard)
- One view of everything due in the next 7 days: care items + money due, combined
- Open tasks across the family
- Combined monthly outflow (loan EMIs + recurring care costs)
- Stays live — updates automatically when you mark something paid/done elsewhere, no refresh needed

### Care
- Log medications, appointments, checkups, and status notes per family member
- Pick a combined date + time for scheduled items
- Assign who's handling it — any app user or any family member with an email on file
- Automatic reminder email ~30 minutes before the scheduled time, to whoever's assigned and
  whoever logged it

### Money
- Track education loan EMIs and family care costs in one ledger
- Category breakdown + combined monthly total
- Mark items paid — reflected immediately across the dashboard

### Family & tasks
- Assign tasks to any app user in the family
- Optional scheduled reminder email for a task, plus a manual "Remind" button anytime
- Mark tasks done

### Email
Homebase sends email for:
- Welcome email on signup (features overview)
- "Welcome to the [Family] family" email when a family member is added with an email on file
- Forgot-password OTP codes
- Family invites
- Task reminders (scheduled + manual)
- Care item reminders (30 minutes before)

If email isn't configured in `.env`, everything else still works — emails just get skipped with
a console warning instead of failing.

## Email setup

Uses `nodemailer` over plain SMTP — works with Gmail (via an App Password) or any transactional
email provider (Resend, etc.) that offers SMTP.

```dotenv
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_app_password
EMAIL_FROM="Homebase <your_email@gmail.com>"
FRONTEND_URL=http://localhost:5173
```

Note: if using a shared-domain provider like Resend without a verified custom domain, you'll
only be able to send to your own account email until you verify a domain you own.

## API overview

### Auth
- `POST /api/auth/register`, `POST /api/auth/login`
- `POST /api/auth/change-password` (authenticated)
- `POST /api/auth/forgot-password/reset-with-old-password`
- `POST /api/auth/forgot-password/request-otp`, `POST /api/auth/forgot-password/reset-with-otp`

### Profile
- `GET /api/users/me`, `PATCH /api/users/me` (requires `currentPassword`)
- `DELETE /api/users/me` (requires `currentPassword`)

### Families
- `POST /api/families`, `GET /api/families`, `POST /api/families/join`
- `GET /api/families/:familyId/members` — app users in the family
- `POST /api/families/:familyId/relatives` — add a family member
- `PATCH /api/families/:familyId/relatives/:relativeId`, `DELETE .../relatives/:relativeId`
- `POST /api/families/:familyId/invite` — email an invite
- `DELETE /api/families/:familyId` (primary earner only)

### Care, Money, Tasks
- `GET/POST /api/care-items`, `PATCH /api/care-items/item/:id`
- `GET/POST /api/loan-items`, `GET /api/loan-items/:familyId/summary`, `PATCH .../item/:id`
- `GET/POST /api/tasks`, `PATCH /api/tasks/item/:id`, `POST /api/tasks/item/:id/remind`

### Dashboard
- `GET /api/dashboard/:familyId`

## What's intentionally not built yet
- Care-manager marketplace, teleconsultation, wearables integration
- Payment processing — expenses track amounts/due dates only, not transactions
- Document/file storage (medical records, loan documents)