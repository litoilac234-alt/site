# Deploy to Render (free)

This app (React + PHP + MySQL) runs as **one Docker web service** on Render plus a **free external MySQL** database (TiDB Serverless).

No XAMPP needed — everything runs in the cloud.

---

## 1. Push the repo to GitHub

Your repo must be on GitHub (e.g. `litoilac234-alt/site`).

---

## 2. Create free MySQL (TiDB Serverless)

Render free tier does **not** include MySQL. Use **TiDB Cloud** (MySQL-compatible, free tier):

1. Go to [tidbcloud.com](https://tidbcloud.com/) → sign up (free).
2. Create a **Serverless** cluster (region closest to you, e.g. AWS Singapore).
3. Open the cluster → **Connect** → choose **General** connection.
4. Note these values:

| TiDB field | Maps to Render env var |
|------------|------------------------|
| Host | `MYSQLHOST` |
| Port (usually `4000`) | `MYSQLPORT` |
| Database | `MYSQLDATABASE` |
| User | `MYSQLUSER` |
| Password | `MYSQLPASSWORD` |

5. Enable **SSL** in TiDB (default for Serverless). Set `MYSQL_SSL=1` on Render (already in `render.yaml`).

---

## 3. Create Render web service

1. Go to [render.com](https://render.com/) → sign up (GitHub login is easiest).
2. **New** → **Web Service**.
3. Connect your GitHub repo `site`.
4. Settings:

| Setting | Value |
|---------|--------|
| **Name** | `peo-monitoring` (or any name) |
| **Region** | Singapore (or nearest to TiDB) |
| **Branch** | `main` |
| **Runtime** | **Docker** |
| **Plan** | **Free** |

5. **Environment variables** (Add all of these):

| Variable | Example / notes |
|----------|-----------------|
| `APP_URL` | `https://peo-monitoring.onrender.com` (use your actual Render URL after first deploy) |
| `APP_BASE_PATH` | `/` |
| `MYSQLHOST` | From TiDB connect dialog |
| `MYSQLPORT` | `4000` |
| `MYSQLDATABASE` | e.g. `test` |
| `MYSQLUSER` | From TiDB |
| `MYSQLPASSWORD` | From TiDB |
| `MYSQL_SSL` | `1` |

6. **Advanced** → Health Check Path: `/api/health.php`

7. Click **Create Web Service**. First build takes ~5–10 minutes.

---

## 4. Initialize the database

After the first successful deploy:

1. Open in browser:  
   `https://YOUR-SERVICE.onrender.com/api/setup_db.php`
2. You should see `OK: database installed.` and demo login hint.
3. If tables already exist: `OK: tables already exist.`

Or run once from Render **Shell** (if available on your plan):

```bash
php /var/www/html/api/setup_db.php
```

---

## 5. Open the app

- **URL:** `https://YOUR-SERVICE.onrender.com`
- **Demo logins:**

| Role | Email | Password |
|------|-------|----------|
| Engineer I | `engineer1@peo.local` | `demo123` |
| Contractor | `contractor@build.local` | `demo123` |

---

## Free tier notes

| Topic | Behavior |
|-------|----------|
| **Sleep** | Free service spins down after ~15 min idle. First visit may take 30–60 s to wake. |
| **PDF storage** | Ephemeral disk — generated PDFs are **lost on redeploy**. For persistence, upgrade to a paid plan with a disk or use external storage. |
| **TiDB free** | Generous free tier; keep cluster active in TiDB dashboard. |

---

## Optional: Blueprint deploy

If Render offers **Blueprint** from `render.yaml`:

1. **New** → **Blueprint**
2. Connect repo — Render reads `render.yaml`
3. Still add `MYSQL*` and `APP_URL` manually in the dashboard (secrets)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Application failed to respond | Check **Logs** tab; confirm `PORT` is used (Docker entrypoint handles this). |
| Database connection failed | Verify TiDB cluster is running; check host/port/user/pass; ensure `MYSQL_SSL=1`. |
| Blank page / 404 on refresh | `APP_BASE_PATH` must be `/` on Render (not `/site/`). |
| CORS / wrong API URL | Set `APP_URL` to exact Render HTTPS URL (no trailing slash). |
| Slow first load | Normal on free tier (cold start). |

---

## Local XAMPP still works

- Defaults in `api/config.php` remain `localhost` / XAMPP paths.
- Vite base stays `/site/` locally unless `VITE_BASE=/`.
- Open `http://localhost/site/` after `npm run build`, or `npm run dev` for hot reload.

---

## Switching from Railway

Same Docker image and same `MYSQL*` variable names. Copy TiDB/Railway credentials into Render env vars and redeploy.
