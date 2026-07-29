# Deploy to Railway

This app (React + PHP + MySQL) deploys as **one Docker web service** plus a **MySQL** database.

## 1. Push the repo to GitHub

Commit these Railway files and push your project.

## 2. Create a Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. **Add MySQL** (Database → MySQL)
3. **Add service** from your GitHub repo (Dockerfile is auto-detected)

## 3. Wire variables on the web service

In the web service → **Variables**, add:

| Variable | Value |
|----------|--------|
| `APP_URL` | `https://YOUR-SERVICE.up.railway.app` (after generating domain) |
| `APP_BASE_PATH` | `/` |
| `MYSQLHOST` | `${{MySQL.MYSQLHOST}}` |
| `MYSQLPORT` | `${{MySQL.MYSQLPORT}}` |
| `MYSQLDATABASE` | `${{MySQL.MYSQLDATABASE}}` |
| `MYSQLUSER` | `${{MySQL.MYSQLUSER}}` |
| `MYSQLPASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |

Replace `MySQL` with your database service name if different.

## 4. Public URL

Web service → **Settings** → **Networking** → **Generate Domain**.  
Then set `APP_URL` to that HTTPS URL (no trailing slash).

## 5. Import the database

1. Open the MySQL service → **Data** / connect with any MySQL client using Railway credentials
2. Import `database/install.sql` (creates tables + demo users)

Or from your PC (replace host/user/pass):

```bash
mysql -h HOST -u USER -p DATABASE < database/install.sql
```

## 6. Persistent PDF storage (recommended)

Web service → **Settings** → **Volumes** → mount a volume at:

`/var/www/html/storage`

Without this, generated PDFs are lost on every redeploy.

## Local XAMPP still works

- Defaults in `api/config.php` remain `localhost` / `root` / `peo_monitoring`
- Vite base stays `/site/` unless you set `VITE_BASE=/`
- Open `http://localhost/site/` after `npm run build`, or `npm run dev` for hot reload

## Demo logins

| Role | Email | Password |
|------|-------|----------|
| Engineer I | `engineer1@peo.local` | `demo123` |
| Contractor | `contractor@build.local` | `demo123` |
