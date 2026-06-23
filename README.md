# ElectroPi — Project & Task Management API

A production-ready RESTful API for managing projects and tasks, built for the ElectroPi Backend Node.js Technical Assessment.

It provides JWT authentication (register/login + password reset via email), full CRUD for projects and tasks with ownership-based access, role-based access control (Admin / Member), pagination, sorting, and filtering — built on a layered architecture with input validation and centralized error handling.

> **Implementation details, design decisions, and the full API reference are in [NOTES.md](./NOTES.md).** To explore the API, import `electropi.postman_collection.json` into Postman.

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js v18+ |
| Framework | Express.js v5 |
| Database | MongoDB |
| ODM | Mongoose v9 |
| Language | TypeScript |
| Auth | JWT + bcryptjs |
| Validation | Zod |
| Email | Resend + Handlebars |
| Testing | Jest + Supertest |
| Containerization | Docker + Docker Compose |

## API Endpoints

Base URL: `http://localhost:5000/api`. Protected endpoints require an `Authorization: Bearer <jwt_token>` header. Full request/response details are in the Postman collection; see [NOTES.md](./NOTES.md) for query params and behavior.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register (name, email, password) |
| POST | `/auth/login` | No | Login, returns JWT |
| GET | `/auth/me` | Yes | Current user |
| POST | `/auth/forgot-password` | No | Request password reset email |
| POST | `/auth/reset-password/:token` | No | Reset password with emailed token |
| POST | `/projects` | Yes | Create project |
| GET | `/projects` | Yes | List projects (paginated, sortable) |
| GET | `/projects/:id` | Yes | Get a project |
| PATCH | `/projects/:id` | Yes | Update a project |
| DELETE | `/projects/:id` | Yes | Delete a project |
| POST | `/projects/:projectId/tasks` | Yes | Create task under a project |
| GET | `/projects/:projectId/tasks` | Yes | List tasks (paginated, filter by status/priority) |
| GET | `/projects/:projectId/tasks/:taskId` | Yes | Get a task |
| PATCH | `/projects/:projectId/tasks/:taskId` | Yes | Update a task |
| DELETE | `/projects/:projectId/tasks/:taskId` | Yes | Delete a task |
| GET | `/health` | No | Service health check |

## How to Run Locally

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- npm

### 1. Clone & install

```bash
git clone <repo-url>
cd electropi-project-task-management
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values (see Environment Variables below)
```

### 3. Run in development

```bash
npm run dev
```

The API will be available at `http://localhost:5000`.

### 4. Seed the database (optional)

```bash
npm run seed
```

This creates:
- **Admin**: `admin@electropi.com` / `admin123`
- **Member**: `member@electropi.com` / `member123`

### 5. Build & run for production

```bash
npm run build
npm start
```

### Run tests

```bash
npm test
npm run test:coverage
```

### Run with Docker

```bash
cp .env.example .env        # set JWT_SECRET at minimum
docker compose up -d        # starts MongoDB + API
docker compose exec api npm run seed   # optional: seed after containers are up
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/electropi_pm
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development

# Email (Resend — https://resend.com)
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=ElectroPi PM <noreply@yourdomain.com>
FRONTEND_URL=http://localhost:3000
RESET_TOKEN_EXPIRES_MINUTES=10
```

> **⚠️ Email-dependent endpoints (e.g. `forgot-password`) only deliver a real email when:**
> 1. A valid `RESEND_API_KEY` is configured in `.env`, **and**
> 2. The request uses a **real email address you can access** — not a placeholder.
>
> The example emails in the Postman collection (e.g. `member@electropi.com`) are illustrative only and will not receive mail. Note that `forgot-password` always returns `200` (to prevent user enumeration), so a success response does **not** by itself mean an email was sent.

## Troubleshooting

**Can't connect to MongoDB Atlas on startup**

The most common cause is that your IP isn't allowed to reach the cluster. In the Atlas dashboard go to **Network Access → Add IP Address** and add `0.0.0.0/0` (allow access from anywhere — fine for testing/assessment). This resolves the majority of connection failures on its own.

**`querySrv ECONNREFUSED ..._mongodb._tcp.<cluster>.mongodb.net`**

If you see this *after* allowing your IP, your machine's DNS resolver can't perform the SRV lookup that `mongodb+srv://` connection strings require (common with some VPNs, corporate networks, or a local `127.0.0.1` stub resolver). It is **not** a code or credentials issue. The app already guards against this: `connectDB()` in `src/config/db.ts` detects a failing SRV lookup and transparently retries through public DNS (`8.8.8.8` / `1.1.1.1`). If you still hit it, you can also:

- Set your OS network adapter's DNS to `8.8.8.8` / `1.1.1.1`, or
- Use a standard (non-SRV) `mongodb://host1,host2,host3/...` connection string from the Atlas UI, or
- Run a local MongoDB and point `MONGO_URI` at `mongodb://localhost:27017/electropi_pm`.
