## Changes in v2.1.8

### Studio Notification Dispatcher and Notification Center
- **Notification dispatcher:** Decoupled `dispatchNotification` event bus using `CustomEvent('studio:notification')` and unique `crypto.randomUUID()` identifiers.
- **Audio feedback:** Web Audio API sound cues via `soundEngine.ts` (`playSuccessSound`, `playErrorSound`) for operation results.
- **Notification center:** Four filter tabs (`All`, `Unread`, `Processes & Tests`, `System & License`), relative time indicators (`Just now`, `5s ago`, `2m ago`), notification dismissal, and inline action buttons (`Restart Now`, `Open Settings`, `Open License`, `View Tools`).
- **Event connections:**
  - **License:** Real-time notifications on Pro activation, failure, and key revocation or deactivation.
  - **Auto-updater:** Alerts when an update is available or downloaded and ready to install.
  - **Autonomous tools:** Notifications on Automated Test Suite completion, Concurrency Benchmark finish, and AI Agent Simulation runs.
  - **Server lifecycle:** Connection status with tool, resource, and prompt counts, disconnects, auto-reconnect attempts, and configuration imports.
  - **Settings:** Confirmation on API key vault and timeout saves.
- **State persistence:** Capped 100-item notification array stored in `localStorage` (`mcp_studio_notifications_v1`).

### API Key Vault Synchronization and Simulator Auto-Fill (from v2.1.7)
- **Key harmonization:** Aligned `SETTINGS_KEY` across `SettingsModal.tsx`, `AiSimulator.tsx`, and `OnboardingModal.tsx`.
- **Cross-component sync:** Broadcasts `mcp:settings-updated` and `storage` events on settings save so the AI Simulator uses saved keys without page reloads or tab switches.
- **Simulator visual feedback:** Added a vault status badge and auto-fill indicator in the Simulator sidebar with a navigation link to Settings.
- **Preference persistence:** Persisted selected LLM provider and model across application restarts.

### Artifacts in this Release
- **Windows Setup (NSIS):** `MCP-Studio-Setup-2.1.8.exe`
- **Windows Portable:** `MCP-Studio-Portable-2.1.8.exe`
- **Auto-Update Metadata:** `latest.yml`

