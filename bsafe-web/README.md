# bSafe — Women Safety & Emergency Assistance Platform

A **fully working website** built with plain HTML, CSS, and JavaScript — no build step, no framework, no server required. Data is persisted in the browser via `localStorage`, simulating a real backend so every feature actually works end-to-end.

---

## ✨ What's included

- **Landing page** with role-based sign up (Woman / Volunteer / Admin)
- **Safety profile onboarding** (address, blood group, medical notes, safe zone)
- **Volunteer registration** with ID verification workflow
- **Women's app** — hold-to-trigger SOS button, live location, emergency contacts, nearby map, alert history, profile settings
- **Volunteer dashboard** — incoming alerts, accept/decline, live status updates (En Route → Arrived → Assisting → Resolved), response history
- **Admin dashboard** — alert monitoring, volunteer verification, user management, safe zone management, CSV incident reports
- **Google Maps integration** (optional) — add your API key in the app's Settings; falls back to a clean placeholder map automatically if no key is set

---

## 🚀 Run locally

No build tools needed. Just serve the folder:

```bash
# Option 1: Python
python3 -m http.server 8000

# Option 2: Node
npx serve .

# Option 3: VS Code "Live Server" extension
```

Then open `http://localhost:8000`

> ⚠️ Don't open `index.html` directly via `file://` — some browsers block `fetch`/geolocation on the file protocol. Always use a local server.

---

## 🔑 Demo login credentials

| Role | Phone | Password |
|------|-------|----------|
| Woman (User) | `+91 98765 43210` | `demo1234` |
| Volunteer (verified) | `+91 99888 11111` | `demo1234` |
| Admin | `+91 90000 00000` | `admin123` |

Or just click **"Create Account"** to register fresh.

---

## 🗺️ Enabling Google Maps

By default, maps render as a clean styled placeholder (no API key needed — fully functional).

To enable **real interactive Google Maps**:

1. Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
2. Create a project → Enable **"Maps JavaScript API"**
3. Create an API key (restrict it to your domain for production)
4. In the bSafe app, click the **⚙️ Settings icon** (top right of the Home page)
5. Paste your API key and save

The key is stored in `localStorage` and used automatically across all map views.

---

## 📦 Deploy to Vercel

```bash
npm install -g vercel
cd bsafe-web
vercel --prod
```

Or via the Vercel dashboard: **New Project → Import** this folder → no build command needed → Deploy.

(`vercel.json` is already included.)

---

## 📦 Deploy to Netlify

**Drag & drop:**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the entire `bsafe-web` folder in
3. Done — live in seconds

**CLI:**
```bash
npm install -g netlify-cli
cd bsafe-web
netlify deploy --prod
```

(`netlify.toml` is already included.)

---

## 📁 Project structure

```
bsafe-web/
├── index.html                  # Landing page + login/signup
├── pages/
│   ├── onboarding.html         # Safety profile setup (women)
│   ├── volunteer-register.html # Volunteer registration
│   ├── app.html                # Main women's app (SOS, map, history, profile)
│   ├── volunteer.html          # Volunteer dashboard
│   └── admin.html               # Admin dashboard
├── css/
│   └── global.css              # Design system
├── js/
│   ├── store.js                # Data layer (localStorage-backed, REST-like API)
│   ├── ui.js                   # Toasts, modals, geo/time helpers
│   └── maps.js                 # Google Maps loader + fallback renderer
├── vercel.json
└── netlify.toml
```

---

## 🔌 Connecting a real backend later

`js/store.js` exposes an async, REST-shaped API (`Store.login()`, `Store.createAlert()`, `Store.acceptAlert()`, etc.). Every page calls **only** this object — never `localStorage` directly. To swap in a real Node/Express + MongoDB backend:

1. Replace the function bodies in `store.js` with `fetch()` calls to your API
2. Keep the same function signatures and return shapes
3. No changes needed in any `.html` page

This keeps the migration to a real backend a clean, contained change.

---

## 🔄 Reset demo data

Click **"Reset Demo Data"** at the bottom of the landing page, or run in the browser console:
```js
localStorage.clear()
```
