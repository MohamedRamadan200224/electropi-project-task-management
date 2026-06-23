# Implementation Notes

Important notes about the implementation — architecture, design decisions, and trade-offs (submission requirement #5). For setup and how to run, see [README.md](./README.md). For the full API, import the Postman collection (`electropi.postman_collection.json`).

## Architecture

Layered architecture: **routes → controllers → services → models**, with cross-cutting middleware for auth, validation, and error handling.

```
src/
├── config/          # DB connection, env config
├── controllers/     # Request/response handlers
├── middlewares/     # Auth, validation, sanitization, error handling
├── models/          # Mongoose schemas (User, Project, Task)
├── routes/          # Express routers
├── scripts/         # Seed script
├── services/        # Business logic layer
├── utils/           # AppError, JWT helpers, email sender
├── __tests__/       # Jest unit tests
├── app.ts           # Express app setup
└── server.ts        # Entry point
templates/
├── forgot-password.hbs            # Password reset email template
└── reset-password-success.hbs     # Confirmation email template
```

- **TypeScript** throughout, with a split config: `tsconfig.json` (editor/typecheck, includes tests + Jest types) and `tsconfig.build.json` (compiles `src` to `dist`, excludes tests so the build stays clean).

## Database — migrations vs. seed

MongoDB with Mongoose is **schemaless at the database level** (the schema lives in application code), so traditional SQL-style migrations are not applicable. Database setup is therefore handled via the **seed script** (`npm run seed`), which is the MongoDB-appropriate equivalent. Indexes are declared directly on the Mongoose schemas (e.g. unique index on `User.email`, compound indexes on `Task` for `project + status` / `project + priority`) and are created automatically by Mongoose.

## Authentication & Authorization

- **JWT, single access token.** Login/registration return one signed JWT. The task asked for a "JWT access token" — this is the standard single-token scheme; no refresh-token flow is implemented because the spec did not require one. Default expiry is `7d` (configurable via `JWT_EXPIRES_IN`).
- **Token delivery: response body.** The JWT is returned in the response body for `Authorization: Bearer` use, which suits API clients/Postman. The PDF did not require cookie-based auth, so this standard token-in-body approach was chosen. For a first-party browser SPA, an `httpOnly`, `SameSite` cookie with CSRF protection would be preferable.
- **Passwords** are hashed with **bcrypt** (cost factor 12) and are never returned in any response (`select: false` on the schema).
- All non-auth endpoints require a valid JWT (enforced by `auth.middleware`).

### Role-Based Access Control (RBAC)

| Role | Permissions |
|---|---|
| `admin` | Full access to all projects and tasks |
| `member` | Access only to projects they own or are a member of |

- **Roles are not self-assignable.** Registration accepts only `name`, `email`, and `password`; every new user is created as a `member`. Any `role` field in the request body is ignored — this is enforced in the service layer, which only ever reads `name`/`email`/`password`, preventing privilege escalation via the public registration endpoint.
- The `admin` account is provisioned exclusively through the seed script (`admin@electropi.com` / `admin123`).
- Admins bypass all ownership checks.

## Security

- **NoSQL operator injection** is blocked by a small custom middleware (`src/middlewares/sanitize.middleware.ts`) that strips keys containing `$` or `.` from `req.body`, `req.params`, and `req.query`, applied once globally. It replaces `express-mongo-sanitize`, which is unmaintained and **crashes on Express 5** because it reassigns the now read-only `req.query` (the middleware instead shadows `req.query` via `Object.defineProperty`). It is also preferred over the `mongo-sanitize` package, which only strips `$`-prefixed keys — it ignores dotted keys like `{"user.role": ...}` and must be called manually on every value rather than applied once globally.
- **Helmet** sets security headers. CSP is explicitly configured with `defaultSrc: 'none'` (the API serves no HTML) and `crossOriginResourcePolicy: cross-origin` so browser clients can read CORS responses.
- **compression** applies gzip/deflate to all responses automatically.
- Input is validated on **every** endpoint with **Zod**.

## Password Reset Flow

1. `POST /api/auth/forgot-password` with `{ "email": "..." }`. Always returns `200` regardless of whether the email exists — prevents user enumeration.
2. If the email exists, a reset email is sent containing a reset link (to `FRONTEND_URL`) and the raw reset token.
3. `POST /api/auth/reset-password/:token` with `{ "password": "...", "confirmPassword": "..." }`.
4. A confirmation email is sent on success.

- Reset tokens are stored as **SHA-256 hashes** in the DB; only the raw token is sent via email / used in the URL.
- `resetPasswordToken` and `resetPasswordExpires` are `select: false` and never exposed in responses.
- Tokens expire after `RESET_TOKEN_EXPIRES_MINUTES` (default: 10 minutes) and are single-use.
- **Email delivery requires a real `RESEND_API_KEY` and a real recipient address** — see the warning in the README. A `200` from `forgot-password` does not by itself mean an email was sent.

## Validation & Error Handling

- **Zod** schemas validate `body`, `params`, and `query` per route; validation failures return `400` with a structured list of field errors.
- A global error handler returns correct HTTP status codes via a custom `AppError`. Mongoose `CastError` (invalid ObjectId) and duplicate-key errors are caught globally and mapped to proper `400` / `409` responses.

## API Reference

Base URL: `http://localhost:5000/api`. Protected endpoints require `Authorization: Bearer <jwt_token>`.

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register a new user (name, email, password) |
| POST | `/auth/login` | No | Login, returns JWT |
| GET | `/auth/me` | Yes | Get current user |
| POST | `/auth/forgot-password` | No | Request a password reset email |
| POST | `/auth/reset-password/:token` | No | Reset password using the token from email |

### Projects

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/projects` | Yes | Create project |
| GET | `/projects` | Yes | List projects (paginated) |
| GET | `/projects/:id` | Yes | Get single project |
| PATCH | `/projects/:id` | Yes | Update project |
| DELETE | `/projects/:id` | Yes | Delete project |

**Query params for `GET /projects`**: `page`, `limit`, `sortBy`, `sortOrder` (asc/desc), `status`

### Tasks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/projects/:projectId/tasks` | Yes | Create task |
| GET | `/projects/:projectId/tasks` | Yes | List tasks (paginated, filterable) |
| GET | `/projects/:projectId/tasks/:taskId` | Yes | Get single task |
| PATCH | `/projects/:projectId/tasks/:taskId` | Yes | Update task |
| DELETE | `/projects/:projectId/tasks/:taskId` | Yes | Delete task |

**Query params for `GET` tasks**: `page`, `limit`, `sortBy`, `sortOrder`, `status` (pending/in_progress/done), `priority` (low/medium/high)

- Tasks are scoped to their parent project — all task routes are nested under `/projects/:projectId/tasks`.

### Health Check

`GET /health` — returns service status (no auth).

## Bonus Features Implemented

- Pagination & sorting on list endpoints
- Filtering tasks by status / priority
- Role-based access control (Admin / Member)
- Unit tests (Jest + Supertest)
- Docker Compose setup
- TypeScript
- Password reset via email (Resend + Handlebars templates)

## Postman Collection

`electropi.postman_collection.json` includes all endpoints, including the password reset flow, with a `resetToken` collection variable you paste after receiving the email. The example emails in request bodies (e.g. `member@electropi.com`) are illustrative — replace them with a real address to actually receive reset emails.
