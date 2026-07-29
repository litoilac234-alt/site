# PEO Progress Monitoring System

Automated workflow database system for **email-based progress monitoring** at the Cagayan Provincial Engineer&apos;s Office.

## Contract features

| Feature | Status | Route / Location |
|---------|--------|------------------|
| PDM scheduling & critical path | Implemented (demo data) | `/pdm` |
| Bar chart schedule | Implemented (demo data) | `/bar-chart` |
| S-curve analysis | Implemented (demo data) | `/s-curve` |
| SWA / STEWA / Progress reports | UI + schema ready | `/reports` |
| Email approval workflow | PHP API + UI | `/workflow`, `api/reports.php` |
| QR document verification | UI + API | `/verify?qr=...` |
| Engineer I–IV + Contractor roles | Implemented | `/roles` |

## Deploy (Railway)

See **[DEPLOY-RAILWAY.md](./DEPLOY-RAILWAY.md)** for Docker + MySQL on Railway.

Backup created before Railway changes: `C:\xamppp\htdocs\site-backup-railway-20260729-130735`

## Quick start (frontend)

**XAMPP (Apache):**
```bash
npm install
npm run build
```
Then open [http://localhost/site/](http://localhost/site/)

**Development (hot reload):**
```bash
npm run dev
```
Open [http://localhost:5173/site/](http://localhost:5173/site/)

## Database (XAMPP)

1. Start Apache + MySQL in XAMPP
2. In phpMyAdmin, click **`peo_monitoring`** in the left sidebar
3. Import **`database/install.sql`** (one file — drops old tables and creates fresh)
4. PHP API: `http://localhost/site/api/`

If you only need to add missing tables without wiping data, use `database/schema.sql` instead.

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Engineer I | `engineer1@peo.local` | `demo123` |
| Engineer II | `engineer2@peo.local` | `demo123` |
| Engineer III | `engineer3@peo.local` | `demo123` |
| Engineer IV | `engineer4@peo.local` | `demo123` |
| Contractor | `contractor@build.local` | `demo123` |

## Approval workflow

1. **Engineer I** prepares and submits SWA / STEWA / Progress report
2. **Engineer II** receives email with Approve / Revise buttons
3. On approval → forwarded to **Engineer III** for final checking
4. **Approved** status visible on all accounts; contractor receives PDF copy with QR code

## Still needed for full contract delivery

- Client-provided SWA, STEWA, and Progress Report PDF templates
- PDF generation library (e.g. TCPDF/FPDF) with embedded QR codes
- SMTP configuration for production email (XAMPP `mail()` or PHPMailer)
- Connect frontend forms to PHP API (currently demo/mock data)
- Pilot testing and revision log per contract Section 4.7

## Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Recharts
- **Backend:** PHP 8+, MySQL
- **Deploy:** `npm run build` → serve `dist/` via Apache
