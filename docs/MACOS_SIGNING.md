# macOS code signing & notarization

WorkVault ships as an unsigned `.dmg` today. macOS shows **“unidentified developer”** on first launch until the app is signed and notarized.

## Requirements

- [Apple Developer Program](https://developer.apple.com/programs/) membership ($99/year)
- Mac with Xcode Command Line Tools
- **Developer ID Application** certificate installed in Keychain

## One-time setup

1. Create a **Developer ID Application** cert in Apple Developer → Certificates.
2. Download and install it in Keychain Access.
3. Create an [app-specific password](https://appleid.apple.com) for notarization.
4. Store credentials (never commit these):

```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
export APPLE_ID="you@example.com"
export APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"   # app-specific password
export APPLE_TEAM_ID="TEAMID"
```

Optional — add to `~/.zshrc.local` (not the repo).

## Build signed + notarized `.dmg`

From the repo root with env vars set:

```bash
npm run installer
```

Tauri 2 signs and submits for notarization when the Apple env vars are present. The stapled `.dmg` is written to `src-tauri/target/release/bundle/dmg/`.

## Upload to GitHub Releases

```bash
gh release upload v0.2.0 src-tauri/target/release/bundle/dmg/WorkVault_*.dmg --clobber
```

Update README to remove the “unidentified developer” note once notarized builds are published.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `no identity found` | Install Developer ID cert; match `APPLE_SIGNING_IDENTITY` exactly |
| Notarization rejected | Check `Entitlements.plist`; review log in Xcode Organizer |
| Gatekeeper still blocks | Ensure staple succeeded: `xcrun stapler validate WorkVault.app` |

See [Tauri macOS distribution docs](https://v2.tauri.app/distribute/sign/macos/) for the latest flags.
