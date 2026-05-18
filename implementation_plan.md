# DevHire Backend Implementation Plan

This plan outlines the architecture and steps to build the complete DevHire backend since you will be handling it alone. We will implement the features assigned to Intern B (Backend) and some of the testing/deployment configuration from Intern C.

---

## Phase 1: Project Setup

### Goal
Bootstrap a production-ready Express server that connects to MongoDB, with all foundational middleware in place to safely handle multiple concurrent users.

---

### Functional Requirements

| # | Requirement |
|---|------------|
| F1 | Initialize Node.js project with `npm init` |
| F2 | Install all runtime and dev dependencies |
| F3 | Configure environment variables via `.env` |
| F4 | Protect sensitive files with `.gitignore` |
| F5 | Create `server.js` — Express app with CORS, JSON parsing, request logging, and a `/api/health` check route |
| F6 | Create `config/db.js` — MongoDB connection with event-driven status logging |
| F7 | Server must start cleanly and confirm DB connection on launch |

---

### Non-Functional Requirements

These apply from day one because multiple users will be hitting the server concurrently.

#### NFR-1: Concurrency & Performance
- **MongoDB connection pool:** `maxPoolSize: 10` (configurable via `MONGO_POOL_SIZE` env var). This allows Mongoose to run up to 10 simultaneous DB operations rather than serializing them. Tune upward if load testing reveals bottlenecks.
- **Response compression:** `compression` middleware (gzip) applied globally to reduce payload size for every response — important when many users are fetching job listings simultaneously.
- **HTTP keep-alive:** Node's default HTTP server reuses TCP connections, reducing handshake overhead for concurrent clients.

#### NFR-2: Security
- **HTTP security headers:** `helmet` applied as the first middleware — sets `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, and removes the `X-Powered-By` header.
- **CORS:** Restricted to `CORS_ORIGIN` env var (not wildcard `*`). Concurrent browser clients from unknown origins are rejected.
- **Rate limiting:** `express-rate-limit` — 100 requests per 15 minutes per IP on all routes. Prevents a single bad actor from exhausting the connection pool for other users. Returns `429 Too Many Requests` with a `Retry-After` header.
- **No stack traces in production:** Global error handler returns only `{ message }` when `NODE_ENV=production`.

#### NFR-3: Reliability & Graceful Shutdown
- **MongoDB event listeners:** `connected`, `error`, and `disconnected` events are logged so issues are visible in logs immediately.
- **Graceful shutdown:** On `SIGTERM` / `SIGINT`, the HTTP server stops accepting new connections, in-flight requests are allowed to finish, then the Mongoose connection is closed cleanly. This prevents data corruption during deploys or restarts.
- **Server selection timeout:** `serverSelectionTimeoutMS: 5000` — fails fast if MongoDB is unreachable rather than hanging indefinitely.

#### NFR-4: Observability
- **Request logging:** `morgan` in `dev` format locally, `combined` format in production. Every request/response pair is logged with method, URL, status, and duration — essential for diagnosing concurrency issues.

#### NFR-5: Scalability Readiness
- **Stateless design:** No server-side sessions. All future auth will use JWTs so the app can scale horizontally behind a load balancer without sticky sessions.
- **Environment-driven config:** All tuneable parameters (`PORT`, `MONGO_URI`, pool size, rate limit window) are in `.env` so they can be changed per environment without code changes.

---

### Dependencies

**Runtime:**
```
express mongoose dotenv cors helmet morgan compression express-rate-limit
```

**Dev:**
```
nodemon
```

---

### Step-by-Step Implementation

#### Step 1 — npm init
```bash
npm init -y
```
Then add scripts to `package.json`:
```json
"scripts": {
  "start": "node server.js",
  "dev":   "nodemon server.js"
}
```

#### Step 2 — Install dependencies
```bash
npm install express mongoose dotenv cors helmet morgan compression express-rate-limit
npm install --save-dev nodemon
```

#### Step 3 — `.gitignore`
```
node_modules/
.env
uploads/
*.log
```

#### Step 4 — `.env`
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/devhire
MONGO_POOL_SIZE=10
JWT_SECRET=change_this_to_a_long_random_secret
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

#### Step 5 — `config/db.js`
- Call `mongoose.connect(MONGO_URI, { maxPoolSize })` with `serverSelectionTimeoutMS: 5000` and `socketTimeoutMS: 45000`.
- Attach `connection.on('connected')`, `connection.on('error')`, `connection.on('disconnected')` listeners.
- Export the `connectDB` async function.

#### Step 6 — `server.js`
Middleware order matters — apply in this sequence:
1. `helmet()` — security headers first
2. `cors({ origin: CORS_ORIGIN })` — origin check
3. `compression()` — compress before any response body is written
4. `morgan(format)` — log every request
5. `express.json({ limit: '10kb' })` — parse JSON bodies, cap at 10 KB to block oversized payloads
6. `rateLimiter` — applied globally (or scoped to `/api`)
7. Route mounts (health check for now)
8. Global 404 handler
9. Global error handler

**Health check route** (`GET /api/health`):
```json
{
  "status": "ok",
  "db": "connected",
  "uptime": 12.3,
  "timestamp": "2026-05-18T10:00:00.000Z"
}
```
The `db` field reads `mongoose.connection.readyState` so it honestly reflects DB connectivity.

**Graceful shutdown:**
```js
process.on('SIGTERM', () => shutdown());
process.on('SIGINT',  () => shutdown());

async function shutdown() {
  await server.close();        // stop accepting new connections
  await mongoose.connection.close();
  process.exit(0);
}
```

---

### Checkpoint Criteria

| Check | How to verify |
|-------|--------------|
| Server starts | `npm run dev` — no errors in console |
| DB connects | Console prints `MongoDB connected: <host>` |
| Health route | `GET http://localhost:5000/api/health` returns `200` with `db: "connected"` |
| Rate limit works | Send 101 requests rapidly to any route — 101st returns `429` |
| Security headers | `curl -I http://localhost:5000/api/health` — response includes `X-Content-Type-Options: nosniff` |
| CORS blocks unknown origins | Request from a non-whitelisted origin returns `403` or no `Access-Control-Allow-Origin` header |

---

## User Review Required

> [!IMPORTANT]
> Since you are handling the backend by yourself, we will set up the foundational project, build out the models, and implement the API routes in one go. Please review the proposed models and routes to ensure they align with your expectations before we generate the code.

## Open Questions

> [!WARNING]
> 1. Do you have a local MongoDB instance running, or do you prefer to use a MongoDB Atlas cluster URI? (We will use a `.env` file for configuration, so you can provide this later).
> 2. Are there any specific Node.js versions you want to enforce, or should we just use the latest LTS?
> 3. Should we include the `Jest` and `Supertest` setup right away (from Intern C's tasks), or focus purely on getting the API running first?

## Proposed Architecture

### Dependencies
- **Core:** `express`, `mongoose`, `dotenv`, `cors`
- **Security & Auth:** `bcryptjs`, `jsonwebtoken`
- **File Uploads:** `multer`
- **Dev Tools:** `nodemon`

### Folder Structure
```text
/
├── config/
│   └── db.js                 # MongoDB connection logic
├── controllers/
│   ├── authController.js     # Register, login
│   ├── jobController.js      # CRUD, text search, pagination
│   └── appController.js      # Apply, get applicants, update status
├── middleware/
│   ├── authMiddleware.js     # JWT validation, role-based guards (protect, requireRole)
│   └── uploadMiddleware.js   # Multer config (5MB limit, PDF only, diskStorage)
├── models/
│   ├── User.js               # User schema with pre-save password hashing
│   ├── Job.js                # Job schema with text index & soft-delete
│   └── Application.js        # Application schema with compound unique index
├── routes/
│   ├── authRoutes.js
│   ├── jobRoutes.js
│   └── appRoutes.js
├── uploads/                  # Directory for uploaded resumes
├── .env                      # Environment variables
├── .gitignore
└── server.js                 # Main Express app entry point
```

### Data Models
1. **User:** `name`, `email` (unique), `password` (hashed), `role` (enum: 'seeker', 'employer'), `company` (optional).
2. **Job:** `title`, `company`, `location`, `type`, `description`, `isActive` (boolean for soft delete), `createdBy` (User ref). *Includes full-text index on title, company, description.*
3. **Application:** `job` (Job ref), `applicant` (User ref), `resume` (string path), `status` (enum: 'pending', 'shortlisted', 'rejected'), `coverNote` (string). *Includes compound unique index on `{ job: 1, applicant: 1 }`.*

### API Endpoints
**Auth Routes** (`/api/auth`):
- `POST /register`
- `POST /login`
- `GET /me` (Protected)

**Job Routes** (`/api/jobs`):
- `GET /` (Public: Text search, filter by location/type, pagination)
- `GET /:id` (Public)
- `GET /employer/me` (Protected: Employer)
- `POST /` (Protected: Employer)
- `PUT /:id` (Protected: Employer)
- `DELETE /:id` (Protected: Employer - soft delete)

**Application Routes** (`/api/applications`):
- `POST /jobs/:jobId/apply` (Protected: Seeker, expects Multer `resume` file)
- `GET /jobs/:jobId/applicants` (Protected: Employer)
- `PATCH /:id/status` (Protected: Employer)
- `GET /me` (Protected: Seeker)

## Verification Plan

### Manual Verification
1. We will test the API functionality using Postman or cURL once the code is written.
2. We will confirm MongoDB indexes (text index and unique compound index) are created successfully.
3. We will verify file uploads are correctly saved to the `uploads/` directory and conform to the 5MB/PDF restrictions.

### Automated Tests (Optional/Later phase)
- Use `Jest` and `Supertest` to build test suites for authentication, job CRUD operations, and application flows.
