# Changelog

All notable changes to **MCP Studio** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.8] - 2026-09-08

### Studio Notification Dispatcher and Notification Center
- **Notification dispatcher:** Decoupled `dispatchNotification` event bus using `CustomEvent('studio:notification')` and unique `crypto.randomUUID()` identifiers.
- **Audio feedback:** Web Audio API sound cues via `soundEngine.ts` (`playSuccessSound`, `playErrorSound`).
- **Notification center:** Filter tabs (`All`, `Unread`, `Processes & Tests`, `System & License`), relative time indicators, individual notification dismissal, and inline action buttons (`Restart Now`, `Open Settings`, `Open License`, `View Tools`).
- **Event connections:**
  - **License:** Real-time notifications on Pro activation, failure, and key revocation or deactivation.
  - **Auto-updater:** Notifications when an update is available or downloaded and ready to install.
  - **Automated tools:** Notifications on Automated Test Suite completion, Concurrency Benchmark finish, and AI Agent Simulation runs.
  - **Server lifecycle:** Connection status with tool, resource, and prompt counts, disconnects, auto-reconnect attempts, and configuration imports.
  - **Settings:** Confirmation on API key vault and timeout saves.
- **Persistence:** Capped 100-item notification array persisted in `localStorage` (`mcp_studio_notifications_v1`).

---

## [2.1.7] - 2026-09-08

### API Key Vault Synchronization and Simulator Auto-Fill
- **Key harmonization:** Aligned `SETTINGS_KEY` (`mcp_studio_global_settings_v1`) across `SettingsModal.tsx`, `AiSimulator.tsx`, and `OnboardingModal.tsx` with backward-compatible fallback.
- **Cross-component sync:** Broadcasts `mcp:settings-updated` and `storage` events on settings save so the AI Simulator uses updated keys without page reloads or tab switches.
- **Simulator vault feedback:** Added a vault status badge and auto-fill indicator in the Simulator sidebar with a navigation link to Settings.
- **Preference persistence:** Persisted selected LLM provider and model across application restarts.

---

## [2.1.6] - 2026-09-08

### License Demotion and Compatibility
- **Verification contract:** Updated `/api/verify` in `sync.mtlglabs.space` to return `HTTP 200 OK` with `{ success: false, valid: false, revoked: true }` upon remote license revocation or deletion, allowing previous versions to demote gracefully to Community Edition.
- **Local demotion:** When a revoked license is received, `LicenseManager` purges encrypted local credentials and emits `license:status-changed` to open windows.
- **Heartbeat check:** Desktop application maintains a 5-minute background heartbeat to check license validity.
- **Refund webhook handling:** Webhook detects `adjustment.created` and `adjustment.updated` events from Paddle, maps refunded transaction IDs, and marks licenses as revoked.

### Pre-Checkout Validation
- **Pre-checkout modal:** Validates customer email addresses before opening the Paddle checkout overlay.
- **Email field locking:** Initializes Paddle checkout with `allowLogout: false` and prefilled email to prevent mismatched buyer addresses during checkout.
- **Pricing card cleanup:** Removed redundant inline input from the pricing card.

---

## [2.1.5] - 2026-09-07

### Self-Service Key Retrieval and Telemetry
- **Key retrieval modal:** Self-service modal on the landing and pricing pages allowing customers to retrieve active license keys by email verification.
- **Client telemetry:** Client transmits platform and version metadata upon activation for administrative diagnostics.
- **Webhook handling:** Webhook parser handles raw stream buffers for HMAC-SHA256 signature verification.

---

## [2.1.4] - 2026-09-07

### Checkout Configuration
- **Dynamic config route:** Added `/api/paddle-config` delivering public Paddle tokens dynamically.
- **Metadata binding:** Embedded customer email into Paddle transaction `customData` payload.

---

## [2.1.3] - 2026-09-07

### Multi-Platform Distribution
- **Windows:** Setup installer (`MCP-Studio-Setup-2.1.3.exe`) and portable executable (`MCP-Studio-Portable-2.1.3.exe`).
- **macOS:** Apple Silicon (`arm64`) and Intel (`x64`) DMG and ZIP archives.
- **Linux:** AppImage and Debian/Ubuntu `.deb` packages.
- **NSIS installer:** Added directory confirmation and extraction progress bar.

---

## [2.1.2] - 2026-09-06

### Server Limits and Guidance
- **Limit indicator:** Servers beyond Community Edition limit (1 active server) display `[ PRO ]` badges and are disabled.
- **Limit dialog:** Explains single-server usage with options for upgrading or removing extra servers.

---

## [2.1.0] - 2026-09-05

### First-Run Guided Onboarding
- **Onboarding tour:** Step-by-step guide explaining MCP architecture, server configuration, and developer tools.
- **Local Ollama ping:** Connection check against `127.0.0.1:11434`.
- **Credential vault:** Operating system encrypted storage for Anthropic, OpenAI, and Google AI keys.

---

## [2.0.0] - 2026-09-01

### Initial Open Core Release
- **MCP client:** Client supporting Stdio and remote SSE transports.
- **Schema form generator:** Form generation from tool JSON schema with field validation.
- **Mock data:** Sample input generator based on parameter names.
- **Response visualizer:** JSON tree, data tables, markdown previewer, and base64 media viewer.
- **Developer tools:** Multi-LLM simulator, model comparison, assertion testing, traffic logger, and code snippet generators.

