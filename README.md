# InternTrack

A full-stack MERN system for managing and tracking intern progress.

Admins onboard interns, assign and review tasks, and watch progress across the
cohort. Interns see their tasks, submit work with files and links, and track
their own completion — all updating live over WebSockets, without refreshing.

---

## Features

**Admin**
- Onboard interns (auto-generated temporary password, shown once)
- Full intern CRUD with search, status/department filters and pagination
- Create tasks and **assign one task to several interns at once**
- Review queue: approve work or request revisions with written feedback
- Dashboard: intern/task/review/overdue counts, pending reviews, per-intern
  progress (lowest first) and a live activity timeline

**Intern**
- Dashboard with a progress ring, status breakdown, upcoming deadlines and the
  latest feedback
- Task board with contextual actions (Start / Submit / Resubmit)
- Submit work: notes, an external link, and up to 5 file attachments
- Edit own profile (phone, university, avatar) and change password

**Both**
- Real-time updates and an in-app notification bell over Socket.IO
- JWT auth in an httpOnly cookie, with server-enforced role and ownership checks

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router 7, TanStack Query 5, Tailwind CSS 4, axios, socket.io-client, lucide-react, react-hot-toast, date-fns |
| Backend | Node.js, Express 5, Mongoose 9, Socket.IO 4, JWT, bcryptjs, multer, express-validator, morgan |
| Database | MongoDB (Atlas) |

Both halves are plain JavaScript (ESM), not TypeScript.

---

## Project Structure

```
manage and track intern progress/
├── Backend/            Express API + Socket.IO server
│   ├── config/         db.js, socket.js
│   ├── controllers/    auth, intern, task, submission, dashboard, notification
│   ├── middleware/     auth, upload, validate, errorHandler
│   ├── models/         User, Task, Submission, Notification
│   ├── routes/         one router per resource
│   ├── utils/          generateToken, progress, notify
│   ├── uploads/        submission attachments (gitignored)
│   └── server.js       http.createServer(app) + Socket.IO
├── Frontend/           Vite + React client
│   └── src/
│       ├── api/        axios instance + one module per resource
│       ├── components/ ui/, layout/, interns/, tasks/, submissions/
│       ├── context/    AuthContext, SocketContext
│       ├── hooks/      useAuth, useSocket, useLiveInvalidate, useDebounce
│       ├── pages/      admin/, intern/, Login, ChangePassword, NotFound
│       └── routes/     ProtectedRoute, RoleRoute
├── PROJECT_PLAN.md     the spec this was built against
└── BUILD_GUIDE.md      phase-by-phase build instructions
```

---

## Prerequisites

- **Node.js 18+** and npm
- A **MongoDB Atlas** account (the free M0 tier is enough)

---

## MongoDB Setup

1. Sign in at [cloud.mongodb.com](https://cloud.mongodb.com) and create a free
   **M0** cluster.
2. **Database Access** → *Add New Database User*. Save the password.
3. **Network Access** → *Add IP Address*. For local development choose
   **Allow Access from Anywhere** (`0.0.0.0/0`). Restrict this before deploying.
4. **Connect** → *Drivers* → copy the connection string.
5. Insert your database name in the path, before the `?`:

   ```
   mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/interntrack?retryWrites=true&w=majority
   ```

> **Include the database name.** A connection string ending in `/?...` with no
> path silently falls back to a database called `test`, and your data will
> appear to vanish. On boot the server prints which database it is using:
> `MongoDB connected: <host> — database "interntrack"`.
>
> If your password contains `@ : / ? # [ ] %`, URL-encode it (`@` → `%40`).

---

## Setup

```bash
git clone <your-repo-url>
cd "manage and track intern progress"
```

### Backend

```bash
cd Backend
npm install
```

Create `Backend/.env` (copy `Backend/.env.example` and fill it in):

| Variable | Description | Example |
|---|---|---|
| `PORT` | API port | `5000` |
| `NODE_ENV` | `development` or `production` | `development` |
| `MONGO_URI` | Atlas connection string, **including the database name** | `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/interntrack?...` |
| `JWT_SECRET` | Secret used to sign tokens | a 64-char random hex string |
| `JWT_EXPIRE` | Token lifetime | `7d` |
| `CLIENT_URL` | Frontend origin, for CORS and Socket.IO | `http://localhost:5173` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `5242880` (5MB) |
| `MAX_FILES_PER_SUBMISSION` | Max attachments per submission | `5` |

Generate a proper secret rather than inventing one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend

```bash
cd ../Frontend
npm install
```

No `.env` is needed — Vite proxies `/api` and `/socket.io` to
`http://localhost:5000` (see `Frontend/vite.config.js`).

---

## Seed the Database

Creates the initial admin account:

```bash
cd Backend
npm run seed
```

This removes any existing **admin** accounts and creates a fresh one. Intern
data is left untouched.

---

## Running the App

Two terminals.

**Terminal 1 — backend**

```bash
cd Backend
npm run dev      # nodemon, or `npm start` for plain node
```

Expect:

```
MongoDB connected: <host> — database "interntrack"
Server running in development mode on port 5000
Socket.IO ready
```

**Terminal 2 — frontend**

```bash
cd Frontend
npm run dev
```

Open **http://localhost:5173**.

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@interntrack.com` | `Admin@123` |

There is no public signup by design. Interns are onboarded by the admin, who is
shown a generated temporary password **once** — copy it and give it to the
intern. On first login the intern is required to set their own password.

To try the intern side: log in as admin → **Interns** → **Onboard Intern** →
copy the temporary password → log out → log in as that intern.

---

## Testing Real-Time Features

Real-time behaviour needs two sessions that don't share cookies:

1. Normal window: log in as the **admin**.
2. Incognito/private window: log in as an **intern**.
3. Assign the intern a task — their task list and notification bell update with
   no refresh.
4. As the intern, submit work — it appears in the admin's review queue and the
   admin's bell increments instantly.
5. Approve it — the intern's progress ring animates up.

---

## Available Scripts

**Backend**

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (auto-restart) |
| `npm start` | Start with plain node |
| `npm run seed` | Create/reset the admin account |

**Frontend**

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server on port 5173 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint |

---

## API Overview

All routes are prefixed `/api`. 🔒 = any signed-in user, 👑 = admin only.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/login` | public | Log in, sets the JWT cookie |
| POST | `/auth/logout` | 🔒 | Clear the cookie |
| GET | `/auth/me` | 🔒 | Current user |
| PUT | `/auth/change-password` | 🔒 | Change own password |
| GET/POST | `/interns` | 👑 | List / onboard interns |
| GET/PUT/DELETE | `/interns/:id` | 👑 | Read / update / remove an intern |
| PUT | `/interns/:id/reset-password` | 👑 | Issue a new temp password |
| GET/PUT | `/interns/me/profile` | 🔒 | Own profile |
| GET/POST | `/tasks` | 👑 | List / create (bulk assign) tasks |
| GET | `/tasks/my` | 🔒 | Own tasks |
| GET | `/tasks/:id` | 🔒 | One task (assignee or admin) |
| PUT/DELETE | `/tasks/:id` | 👑 | Update / delete a task |
| PATCH | `/tasks/:id/status` | 🔒 | Assignee: pending → in-progress |
| POST | `/submissions` | 🔒 | Submit work (multipart) |
| GET | `/submissions/pending` | 👑 | Review queue |
| GET | `/submissions/task/:taskId` | 🔒 | Submission history |
| PUT | `/submissions/:id/feedback` | 👑 | Approve / request revision |
| GET | `/submissions/file/:filename` | 🔒 | Download an attachment |
| GET | `/dashboard/admin` | 👑 | Admin dashboard data |
| GET | `/dashboard/intern` | 🔒 | Intern dashboard data |
| GET | `/notifications` | 🔒 | Own notifications + unread count |
| PATCH | `/notifications/:id/read` · `/read-all` | 🔒 | Mark read |

### Socket.IO events

Authenticated at the handshake using the same JWT cookie. Every socket joins
`user:<userId>`; admins also join `admins`.

`task:assigned` · `task:updated` · `task:deleted` · `submission:new` ·
`feedback:received` · `progress:updated` · `notification:new`

---

## Security

- Passwords bcrypt-hashed (cost 10) and `select: false` — never returned
- JWT delivered as an **httpOnly**, `sameSite=lax` cookie (`secure` in
  production), so client-side JavaScript can't read it
- Role checks (`requireAdmin`) **and** ownership checks enforced server-side on
  every route — the UI's role routing is convenience, not security
- Uploads: extension + mimetype whitelist, 5MB/5-file limits, randomised
  filenames, and downloads served through an **authorised route**, never
  `express.static` — attachments are not public URLs
- Every write route validated with `express-validator`; client-side validation
  mirrors it for feedback only and never replaces it
- CORS restricted to `CLIENT_URL` with credentials
- `.env` is gitignored; `.env.example` documents the keys

---

## Screenshots

No screenshots are committed to this repository yet. To add them, capture the
Admin Dashboard, the Review queue and the Intern Dashboard, save them under
`docs/screenshots/`, and reference them here:

```markdown
![Admin Dashboard](docs/screenshots/admin-dashboard.png)
![Review Queue](docs/screenshots/review-queue.png)
![Intern Dashboard](docs/screenshots/intern-dashboard.png)
```

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| `MongooseServerSelectionError` | Atlas IP whitelist, or an unencoded `@`/`#` in the password |
| Data "missing" in Atlas | No database name in `MONGO_URI` — you're looking at `interntrack` but writes went to `test`. Check the startup log. |
| Login works but `/auth/me` returns 401 | Missing `withCredentials` on axios, or `credentials: true` on the server's CORS |
| Config change seems to have no effect | A stale `node server.js` still holds port 5000 — kill it and restart |
| Socket connects then drops | `app.listen()` used instead of `httpServer.listen()` |
| Notifications fire two or three times | A `useEffect` isn't removing its socket listeners on cleanup |
| Tailwind classes do nothing | `@import "tailwindcss"` missing from `index.css`, or the Vite plugin missing from `vite.config.js` |

---

## Documentation

- [PROJECT_PLAN.md](PROJECT_PLAN.md) — data models, API surface, screen designs
- [BUILD_GUIDE.md](BUILD_GUIDE.md) — the phase-by-phase build order
