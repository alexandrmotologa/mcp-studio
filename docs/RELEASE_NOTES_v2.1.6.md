## What's Changed in v2.1.6

### 🛡️ Real-Time License Revocation & Immediate Pro Demotion
- **Server-Side Backwards Compatibility:** Updated `/api/verify` (in `sync.mtlglabs.space`) to return HTTP 200 with `{ success: false, valid: false, revoked: true }` when a license key is revoked or deactivated in `/admin`. This ensures even earlier desktop clients instantly demote Pro status back to Community Edition on startup or manual verification check without misinterpreting 403 as a temporary network error.
- **Immediate Local Demotion:** When a revoked license is received, `LicenseManager` deactivates local cached keys and revokes active features immediately.

### 💳 Universal Pre-Checkout Email Guard
- **Pre-Checkout Modal:** Added a universal interactive modal across all site & pricing entry points (Hero buttons, Pricing cards, nav actions).
- Prevents launching Paddle checkout without a verified customer activation email, completely eliminating orphaned transactions (`Customer email is required to issue license`).
- Integrated automated customData binding forwarding the email directly to Paddle webhooks for instantaneous license provisioning.

### ⚙️ Paddle Webhook Robustness
- Resolved duplicate `transactionId` identifier declarations in serverless webhook handlers.
- Configured raw payload streaming for HMAC SHA-256 signature verification.

### 📦 Artifacts in this Release
- **Windows Setup (NSIS):** `MCP-Studio-Setup-2.1.6.exe` (SHA256 verified)
- **Windows Portable:** `MCP-Studio-Portable-2.1.6.exe`
- **Auto-Update Metadata:** `latest.yml`
