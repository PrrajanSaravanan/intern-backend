# Phase 1 — Your Follow-Up Checklist

These are the manual steps you need to complete to finish Phase 1.  
Each item has a clear action and a success signal so you know when it's done.

---

## 1. Set Your MongoDB URI

**Why:** The `.env` file currently has a placeholder URI for a local MongoDB instance.  
You need to point it at a real database before the server can connect.

**Action — choose one:**

### Option A: MongoDB Atlas (Cloud — Recommended)
1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and sign in / create an account.
2. Create a free **M0** cluster.
3. Under **Database Access**, create a user with a strong password.
4. Under **Network Access**, add your IP address (or `0.0.0.0/0` for development).
5. Click **Connect → Drivers**, copy the connection string.
6. Open `.env` and replace the `MONGO_URI` line:
   ```
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/devhire?retryWrites=true&w=majority
   ```

### Option B: Local MongoDB
1. Install MongoDB Community Edition: [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Start the MongoDB service (`mongod`).
3. The default `.env` value already works:
   ```
   MONGO_URI=mongodb://localhost:27017/devhire
   ```

**Success signal:** Running `npm run dev` prints:
```
MongoDB connected: <your-host>
Server running on port 5000 [development]
```

---

## 2. Set a Strong JWT Secret

**Why:** The `.env` placeholder `change_this_to_a_long_random_secret_before_production` is not secure.  
This secret signs all auth tokens — if it leaks, anyone can forge tokens.

**Action:**
1. Generate a random 64-character secret. You can use Node.js:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. Paste the output into `.env`:
   ```
   JWT_SECRET=<your-generated-secret>
   ```

**Success signal:** `.env` has a long random hex string, not the placeholder.

---

## 3. Update the CORS Origin

**Why:** `CORS_ORIGIN=http://localhost:3000` is correct for local dev, but needs to match wherever your frontend runs.

**Action:**
- If your frontend runs on a different port (e.g. Vite default is `5173`), update `.env`:
  ```
  CORS_ORIGIN=http://localhost:5173
  ```
- If you have no frontend yet, leave it as-is for now.

**Success signal:** The health check request from your frontend's origin is not blocked by CORS.

---

## 4. Start the Server and Verify the Checkpoint

**Action:**
```bash
npm run dev
```

**Verify each checkpoint:**

| Check | Command / Action | Expected result |
|-------|-----------------|-----------------|
| Server starts | `npm run dev` | No error output; prints port and DB host |
| DB connects | Console output | `MongoDB connected: <host>` |
| Health route | `GET http://localhost:5000/api/health` in browser or Postman | `{ "status": "ok", "db": "connected", ... }` |
| 404 handler | `GET http://localhost:5000/api/doesnotexist` | `{ "message": "Route GET /api/doesnotexist not found" }` |
| Security headers | `curl -I http://localhost:5000/api/health` | Response includes `X-Content-Type-Options: nosniff` |

---

## 5. Verify Rate Limiting (Optional but Recommended)

**Why:** Confirms the rate limiter is protecting concurrent-user traffic from abuse.

**Action — run this in a terminal (requires curl):**
```bash
for i in $(seq 1 102); do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5000/api/health; done
```

**Success signal:** The first 100 responses are `200`; responses 101+ are `429`.

---

## 6. Check Security Headers (Optional)

```bash
curl -I http://localhost:5000/api/health
```

You should see headers like:
```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-DNS-Prefetch-Control: off
```

---

## 7. Commit Phase 1 to Git

Once all checkpoints pass, commit the work:
```bash
git add server.js config/db.js package.json package-lock.json .gitignore uploads/.gitkeep
git commit -m "Phase 1: project setup — Express server, MongoDB connection, health check"
```

> **Do NOT** run `git add .` — it could accidentally stage `.env`.  
> `.gitignore` protects it but it's safer to add files explicitly.

---

## What's NOT Needed Yet

- You do NOT need to create the `models/`, `controllers/`, `routes/`, or `middleware/` folders — those are Phase 2+.
- You do NOT need to set up Jest/Supertest yet.
- You do NOT need to configure anything in production/deployment yet.

---

## Checklist Summary

- [ ] MongoDB URI configured in `.env` (Atlas or local)
- [ ] JWT secret replaced with a real random value
- [ ] CORS origin matches your frontend port
- [ ] `npm run dev` starts without errors
- [ ] `GET /api/health` returns `{ status: "ok", db: "connected" }`
- [ ] Phase 1 committed to git
