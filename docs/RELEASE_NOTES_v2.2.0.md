## Changes in v2.2.0

### 2-Way Client Config Sync and Write-Back Engine
- **Client sync writer:** Added `McpConfigWriter` service to synchronize and write back configured servers to desktop AI clients (Google Antigravity IDE, Claude Desktop, Cursor IDE, Windsurf, Zed IDE, VS Code with Cline, Roo Code, Continue.dev).
- **Atomic file writes:** Writes to temporary files (`.tmp_*`) before atomic rename, protecting configurations against crashes during writes.
- **Timestamped snapshots:** Creates automatic backups (`*.bak.[timestamp]`) before altering existing configuration files.
- **Visual diff inspection:** Generates structural previews distinguishing added, modified, and unchanged servers with side-by-side JSON diffs.
- **Sync modal:** User interface with client detection, server selection, diff inspection, and one-click write-back.

### Traffic Analytics, Token Estimator, and Bandwidth Telemetry
- **Token estimator:** Heuristic estimation calculating tokens (~3.8 chars/token) and byte payload sizes for JSON-RPC messages.
- **Traffic analytics drawer:** Slide-over drawer presenting request counts, estimated token usage, data transferred (KB/MB), error rate, and round-trip latency percentiles (P50, P95, P99).
- **Inspector badges:** Direct visual indicators for estimated tokens and byte size for each logged message.
- **Export capabilities:** Downloads recorded traffic sessions as JSON-RPC logs or standard HTTP Archive (HAR) format.

### Automated MCP Contract and Regression Test Runner
- **Assertion engine:** Assertion framework with six rules: `status_success`, `duration_lt`, `schema_valid`, `json_path_equals`, `contains_text`, and `regex_match`.
- **Suite editor:** Dedicated editor with schema-derived mock data prefilling and assertion rule management.
- **Live execution:** Step-by-step runner with status badges, execution progress, latency measurements, and expandable assertion failure traces.
- **Report export:** Compiles execution summaries into Markdown (.md) and JSON (.json) reports.

### Artifacts in this Release
- **Windows Setup (NSIS):** `MCP-Studio-Setup-2.2.0.exe`
- **Windows Portable:** `MCP-Studio-Portable-2.2.0.exe`
- **Auto-Update Metadata:** `latest.yml`
