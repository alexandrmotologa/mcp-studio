## What's Changed in v2.1.8

### 🔔 Studio Notification Dispatcher & Multi-Event Notification Center
- **Universal Notification Dispatcher:** Decoupled `dispatchNotification` event bus using `CustomEvent('studio:notification')` and unique `crypto.randomUUID()` identifiers.
- **Audio Feedback Integration:** Built-in Web Audio API micro-interaction chimes via `soundEngine.ts` (`playSuccessSound` / `playErrorSound`) for satisfying auditory cues.
- **Interactive Notification Center:** 4 filter tabs (`All`, `Unread`, `Processes & Tests`, `System & License`), relative time indicators (`Just now`, `5s ago`, `2m ago`, `1h ago`), individual notification dismissal `(X)`, and inline 1-click action buttons (`Restart Now`, `Open Settings`, `Open License`, `View Tools`).
- **Multi-Event Studio Wiring:**
  - **License Management:** Real-time notifications on Pro activation, failure, and key revocation/deactivation.
  - **Auto-Updater:** Notifies when an update is available or downloaded and ready to install with 1-click restart.
  - **Autonomous Tools:** Emits notifications on Automated Test Suite completion (test counts & duration), Concurrency Benchmark finish (RPS throughput & latency), and AI Agent Simulation runs (message count & tool calls).
  - **Server Lifecycle:** Connection success with tool/resource/prompt counts, disconnect, auto-reconnect watchdog, and Cursor/Claude config imports.
  - **Settings & Vault:** Confirmation on API key vault and engine timeout save.
- **State Persistence:** Capped 100-item notification array persisted in `localStorage` (`mcp_studio_notifications_v1`).

### 🔑 API Key Vault Real-Time Synchronization & Simulator Auto-Fill (from v2.1.7)
- **Key Harmonization:** Aligned `SETTINGS_KEY` across `SettingsModal.tsx`, `AiSimulator.tsx`, and `OnboardingModal.tsx`.
- **Real-Time Cross-Component Sync:** Immediate `mcp:settings-updated` and `storage` event broadcast on settings save so the AI Simulator instantly picks up saved keys without requiring page refreshes or tab switching.
- **Simulator Visual Feedback:** Added an emerald `✓ Vault Active` badge and auto-fill status in the Simulator sidebar with a 1-click `[Vault]` navigation link.
- **Preference Persistence:** Persisted selected LLM provider and model across application restarts.

### 📦 Artifacts in this Release
- **Windows Setup (NSIS):** `MCP-Studio-Setup-2.1.8.exe` (SHA256 verified)
- **Windows Portable:** `MCP-Studio-Portable-2.1.8.exe`
- **Auto-Update Metadata:** `latest.yml`
