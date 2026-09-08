## Changes in v2.1.6

### License Revocation and Demotion
- **Server-side compatibility:** Updated `/api/verify` (in `sync.mtlglabs.space`) to return HTTP 200 with `{ success: false, valid: false, revoked: true }` when a license key is revoked or deactivated in `/admin`. Desktop clients demote Pro status back to Community Edition on startup or check without misinterpreting 403 as a temporary network error.
- **Immediate local demotion:** When a revoked license status is received, `LicenseManager` deactivates local cached keys and revokes active features immediately.

### Pre-Checkout Email Guard
- **Pre-checkout modal:** Added a modal across all site and pricing entry points (Hero buttons, Pricing cards, nav actions).
- **Email requirement:** Prevents launching Paddle checkout without a verified customer activation email, avoiding orphaned transactions.
- **Metadata binding:** Forwards the email directly to Paddle webhooks for license provisioning.

### Paddle Webhook Handlers
- Resolved duplicate `transactionId` identifier declarations in serverless webhook handlers.
- Configured raw payload streaming for HMAC SHA-256 signature verification.

### Artifacts in this Release
- **Windows Setup (NSIS):** `MCP-Studio-Setup-2.1.6.exe`
- **Windows Portable:** `MCP-Studio-Portable-2.1.6.exe`
- **Auto-Update Metadata:** `latest.yml`

