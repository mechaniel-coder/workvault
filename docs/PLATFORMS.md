# WorkVault — All platforms

WorkVault is **local-first**. The desktop app is the primary experience; web, mobile, and self-host extend reach.

## Platform matrix

| Platform | Status | How to get it |
|----------|--------|---------------|
| **macOS** (Apple Silicon) | Available | [GitHub Releases](https://github.com/mechaniel-coder/workvault/releases) `.dmg` |
| **Windows** (x64) | Coming soon | Watch [Releases](https://github.com/mechaniel-coder/workvault/releases) |
| **Linux** (x64) | Coming soon | Watch [Releases](https://github.com/mechaniel-coder/workvault/releases) |
| **Mobile web / PWA** | Available | [workvault.netlify.app](https://workvault.netlify.app) → Install / Add to Home Screen |
| **iOS / Android (stores)** | Capacitor | Build locally (see below) |
| **Self-hosted server** | Docker | `deploy/docker-compose.yml` |

---

## Desktop (Mac, Windows, Linux)

### End users

Download from [Releases](https://github.com/mechaniel-coder/workvault/releases/latest).

| OS | Data location |
|----|----------------|
| macOS | `~/Library/Application Support/com.workvault.desktop/` |
| Windows | `%APPDATA%\com.workvault.desktop\` |
| Linux | `~/.local/share/com.workvault.desktop/` |

### Build locally

Licensed developers with repository access:

```bash
npm install
npm run installer   # .dmg / .exe / .AppImage / .deb on your OS
```

### Release builds

Official installers are uploaded to [GitHub Releases](https://github.com/mechaniel-coder/workvault/releases). Pushing a version tag can trigger multi-OS builds via GitHub Actions when enabled.

---

## PWA (phones & tablets)

1. Open [workvault.netlify.app](https://workvault.netlify.app) in Chrome (Android) or Safari (iOS).
2. **Android:** tap **Install app** when prompted, or browser menu → Install.
3. **iOS:** Share → **Add to Home Screen**.

Features:

- Standalone display, offline shell (service worker)
- Bottom navigation on small screens
- Same localStorage data model as the web app

Cloud features (sync, assistant, integrations) use Netlify APIs when online.

---

## App Store / Play Store (Capacitor)

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

### Open in IDE

```bash
npm run cap:ios      # opens Xcode
npm run cap:android  # opens Android Studio
```

Store submission is manual — configure signing, icons, and privacy labels in each platform project after `cap sync`.

---

## Self-host (Docker)

Run a static build plus a small API proxy on your own infrastructure:

```bash
cd deploy
docker compose up -d --build
```

Default port: **8080**. Set `NETLIFY_FUNCTIONS_URL` in `deploy/docker-compose.yml` if you proxy to your Netlify functions deployment.

---

## Industry workspaces

WorkVault ships **36 industry-tailored workspaces** (navigation, terminology, themes, welcome pages). Browse them at:

**https://workvault.netlify.app/welcome**

Each industry adapts the dashboard, onboarding picker, and public landing page without changing the underlying data model.

---

## API & integrations

| Feature | Where it runs |
|---------|---------------|
| Auth & sync | Netlify Identity + Blobs |
| Payments | Stripe / Square / PayPal functions |
| OAuth | Google, Dropbox, Slack, etc. |
| Assistant | Netlify AI Gateway |
| Client hosted links | Netlify Functions |

Desktop and PWA call these endpoints when **Settings → Cloud Sync** is enabled. All core CRUD works offline in the desktop app.

---

## Versioning

Desktop version is set in:

- `package.json` → `version`
- `src-tauri/tauri.conf.json` → `version`

Keep them in sync before tagging a release.
