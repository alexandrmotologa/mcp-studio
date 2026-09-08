# Changelog

All notable changes to **MCP Studio** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.8] — 2026-09-08

### 🔔 Studio Notification Dispatcher & Multi-Event Notification Center
- **Universal Notification Dispatcher:** Decoupled `dispatchNotification` event bus using `CustomEvent('studio:notification')` and unique `crypto.randomUUID()` identifiers.
- **Audio Feedback Integration:** Built-in Web Audio API micro-interaction chimes via `soundEngine.ts` (`playSuccessSound` / `playErrorSound`).
- **Interactive Notification Center:** 4 filter tabs (`All`, `Unread`, `Processes & Tests`, `System & License`), relative time indicators (`Just now`, `5s ago`, `2m ago`, `1h ago`), individual notification dismissal `(X)`, and inline 1-click action buttons (`Restart Now`, `Open Settings`, `Open License`, `View Tools`).
- **Multi-Event Studio Wiring:**
  - **License:** Real-time notifications on Pro activation, failure, and key revocation/deactivation.
  - **Auto-Updater:** Notifies when an update is available or downloaded and ready to install with 1-click restart.
  - **Autonomous Tools:** Emits notifications on Automated Test Suite completion (test counts & duration), Concurrency Benchmark finish (RPS throughput & latency), and AI Agent Simulation runs (message count & tool calls).
  - **Server Lifecycle:** Connection success with tool/resource/prompt counts, disconnect, auto-reconnect watchdog, and Cursor/Claude config imports.
  - **Settings & Vault:** Confirmation on API key vault and engine timeout save.
- **Persistence:** Capped 100-item array persisted in `localStorage` (`mcp_studio_notifications_v1`).

---

## [2.1.7] — 2026-09-08

### 🔑 API Key Vault Real-Time Synchronization & Simulator Auto-Fill
- **Key Harmonization:** Aligned `SETTINGS_KEY` (`mcp_studio_global_settings_v1`) across `SettingsModal.tsx`, `AiSimulator.tsx`, and `OnboardingModal.tsx` with backward-compatible fallback.
- **Real-Time Cross-Component Sync:** Immediate `mcp:settings-updated` and `storage` event broadcast on settings save so the AI Simulator instantly picks up saved keys without requiring page refreshes or tab switching.
- **Simulator Visual Feedback:** Added an emerald `✓ Vault Active` badge and auto-fill status in the Simulator sidebar with a 1-click `[Vault]` navigation link.
- **Preference Persistence:** Persisted selected LLM provider and model across application restarts.

---

## [2.1.6] — 2026-09-08

### 🛡️ Real-Time License Demotion & Backward Compatibility
- **Serverless Verification Contract:** Updated `/api/verify` in `sync.mtlglabs.space` to return `HTTP 200 OK` with `{ success: false, valid: false, revoked: true }` upon remote license revocation or deletion. This ensures full backward compatibility with previously installed desktop versions, which will now instantly execute local demotion back to Community Edition without treating 403 as a network glitch.
- **Immediate Local Demotion:** When a revoked license is received, `LicenseManager` purges encrypted local credentials and emits `license:status-changed` to all windows.
- **Heartbeat Check:** Desktop application maintains a low-impact 5-minute background heartbeat to detect administrative changes.
- **Automatic Refund Revocation:** Webhook automatically detects `adjustment.created` and `adjustment.updated` events from Paddle, maps the refunded transaction ID to its license, and marks it permanently revoked.

### 💳 Universal Pre-Checkout Guard & UX Polish
- **Interactive Pre-Checkout Modal:** Added an interactive modal across all entry points (Hero buttons, Pricing cards, nav actions) requiring users to enter a validated email address before Paddle checkout can open.
- **Field Lock in Checkout (`allowLogout: false`):** Paddle checkout is initialized with `allowLogout: false` and prefilled `customer.email`, preventing accidental alterations to the verified buyer email during payment.
- **Clean Pricing Card:** Removed redundant inline input from the pricing card for a cleaner, modern presentation.

---

## [2.1.5] — 2026-09-07

### 🔑 Multi-Key Self-Service Retrieval & Telemetry
- **Key Retrieval Portal:** Added a self-service modal on the landing and pricing pages allowing customers to retrieve all active license keys by verifying their purchase email.
- **Client Telemetry:** App transmits platform and version metadata upon activation for reliable administrative analytics.
- **Defensive Webhook Pipeline:** Webhook parser handles raw stream buffers safely for HMAC-SHA256 signature verification.

---

## [2.1.4] — 2026-09-07

### ⚡ Checkout Binding
- **Dynamic Config Route:** Added `/api/paddle-config` delivering public Paddle tokens dynamically.
- **CustomData Binding:** Embedded customer email into Paddle transaction `customData` payload.

---

## [2.1.3] — 2026-09-07

### 🚀 Complete Multi-Platform Suite & Distribution
- **Windows:** Setup installer (`MCP-Studio-Setup-2.1.3.exe`) and portable executable (`MCP-Studio-Portable-2.1.3.exe`).
- **macOS:** Apple Silicon (`arm64`) and Intel (`x64`) DMG/ZIP archives.
- **Linux:** Standalone AppImage and Debian/Ubuntu `.deb` packages.
- **NSIS Setup Wizard UX Fix:** Added clean directory confirmation and visible extraction progress bar.

---

## [2.1.2] — 2026-09-06

### 🛡️ Server Limits & Conversion Guidance
- **Visual Gating:** Servers beyond Community Edition limit (1 active server) display `[ 🔒 PRO ]` badges.
- **Conversion Dialog:** Clear guidance modal clarifying single-server development with upgrade options.

---

## [2.1.0] — 2026-09-05

### 🌟 Luxury Guided Onboarding
- **4-Step Welcome Tour:** Interactive guide explaining MCP architecture, server hubs, and power tools.
- **Local Ollama Health Ping:** Instant connection detection on `127.0.0.1:11434`.
- **Inline Key Vault:** DPAPI-encrypted storage for Anthropic, OpenAI, and Google AI keys.

---

## [2.0.0] — 2026-09-01

### 🎉 Initial Open Core Release
- **Core MCP Client:** Full-featured client supporting Stdio and remote SSE transports.
- **Dynamic Schema Form Generator:** Automatic form generation from JSON Schema with validation.
- **Smart Mock Data:** 1-Click parameter generation based on Faker heuristics.
- **Response Visualizer:** JSON Tree, Smart Data Tables, Markdown Previewer, and Base64 Media Viewer.
- **15 Power Tools:** Multi-LLM simulator, benchmark arena, assertion testing, traffic logger, and code generators.
