# WorkVault — All platforms

WorkVault is **local-first**. The desktop app is the primary experience; web, mobile, and self-host extend reach.

## Platform matrix

| Platform | Status | How to get it |
|----------|--------|---------------|
| **macOS** (Apple Silicon) | ✅ Desktop | [GitHub Releases](https://github.com/mechaniel-coder/workvault/releases) `.dmg` |
| **Windows** (x64) | ✅ Desktop | Releases `.exe` (NSIS) |
| **Linux** (x64) | ✅ Desktop | Releases `.AppImage` / `.deb` |
| **Mobile web / PWA** | ✅ | [workvault.netlify.app](https://workvault.netlify.app) → Install / Add to Home Screen |
| **iOS / Android (stores)** | 🔧 Capacitor | Build locally (see below) |
| **Self-hosted server** | 🔧 Docker | `deploy/docker-compose.yml` |

---

## Phase 1–2: Desktop (Mac, Windows, Linux)

### End users

Download from [Releases](https://github.com/mechaniel-coder/workvault/releases/latest).

| OS | Data location |
|----|----------------|
| macOS | `~/Library/Application Support/com.workvault.desktop/` |
| Windows | `%APPDATA%\com.workvault.desktop\` |
| Linux | `~/.local/share/com.workvault.desktop/` |

### Build locally

```bash
npm install
npm run installer   # .dmg / .exe / .AppImage / .deb on your OS
```

### CI releases

Push a version tag to trigger multi-OS builds:

```bash
git tag v0.2.0
git push origin v0.2.0
```

If GitHub Actions shows `startup_failure`, build on each OS locally and upload assets manually to the release.

---

## Phase 3: PWA (phones & tablets)

1. Open [workvault.netlify.app](https://workvault.netlify.app) in Chrome (Android) or Safari (iOS).
2. **Android:** tap **Install app** when prompted, or browser menu → Install.
3. **iOS:** Share → **Add to Home Screen**.

Features:

- Standalone display, offline shell (service worker)
- Bottom navigation on small screens
- Same localStorage data model as the web app

Cloud features (sync, AI, integrations) still use Netlify APIs.

---

## Phase 4: App Store / Play Store (Capacitor)

Native shells wrap the same React build. API calls route to Netlify (or your self-hosted API).

### Prerequisites

- **iOS:** macOS, Xcode, Apple Developer account
- **Android:** Android Studio, JDK 17+

### First-time setup

```bash
npm install
npm run build:mobile
npx cap add ios      # once
npx cap add android  # once
npm run cap:sync
```

### Open native IDEs

```bash
npm run cap:ios       # Xcode
npm run cap:android   # Android Studio
```

### Store checklist

- [ ] App icons & splash (from `src-tauri/icons/`)
- [ ] Privacy policy URL
- [ ] Sign in / cloud sync disclosure
- [ ] TestFlight / internal testing track before public release

Bundle IDs:

- Desktop (Tauri): `com.workvault.desktop`
- Mobile (Capacitor): `com.workvault.app`

---

## Phase 5: Self-hosted server

Host the web UI on your own domain. API requests proxy to Netlify by default (hybrid mode). Full air-gapped API requires porting `netlify/functions/` — tracked as future work.

### Quick start (Docker)

```bash
cd deploy
cp .env.example .env   # optional: set WORKVAULT_API_URL
docker compose up -d --build
```

Open `http://localhost:8080`.

### Environment

| Variable | Purpose |
|----------|---------|
| `PORT` | Host port (default `8080`) |
| `WORKVAULT_API_URL` | Upstream for `/api/*` (default `https://workvault.netlify.app`) |
| `VITE_API_BASE` | Build-time API origin baked into static assets (optional) |

### Without Docker

```bash
npm run build
cd deploy/server && npm install
WORKVAULT_API_URL=https://workvault.netlify.app node index.mjs
```

---

## API routing summary

| Runtime | `/api/*` target |
|---------|-----------------|
| Netlify web | Same origin |
| Desktop (Tauri) | `https://workvault.netlify.app` |
| Capacitor native | `https://workvault.netlify.app` (or `VITE_API_BASE`) |
| Self-host (Docker) | Proxied to `WORKVAULT_API_URL` |
| Custom | Set `VITE_API_BASE` at build time |

---

## Recommended daily workflow

1. **Contractors:** WorkVault desktop app (Mac/Win/Linux)
2. **Clients:** Hosted link or `.workvault` file import
3. **On the go:** PWA or Capacitor app
4. **Your infra:** Self-host frontend + optional API upstream
