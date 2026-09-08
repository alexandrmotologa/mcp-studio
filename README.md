# MCP Studio 🚀

<div align="center">

![MCP Studio Icon](https://raw.githubusercontent.com/alexandrmotologa/mcp-studio/main/icon.png)

### The Ultimate Desktop IDE, Inspector & Testing Platform for Model Context Protocol (MCP)

[![Release](https://img.shields.io/badge/release-v2.1.8-indigo.svg)](https://github.com/alexandrmotologa/mcp-studio/releases)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/tests-passing-emerald.svg)]()
[![Electron](https://img.shields.io/badge/Electron-v34.2.0-47848F.svg?logo=electron&logoColor=white)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-v19.0.0-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Architecture](https://img.shields.io/badge/Architecture-Open%20Core-blueviolet.svg)](https://mcp.mtlglabs.space)

[🌐 Official Website](https://mcp.mtlglabs.space) • [🏢 MTLG Labs](https://mtlglabs.space) • [📜 Changelog](CHANGELOG.md) • [📥 Official Releases](https://github.com/alexandrmotologa/mcp-studio/releases) • [👨‍💻 Author Portfolio](https://mtlg.site) • [👔 LinkedIn](https://linkedin.com/in/alexandr-motologa)

<br/>

[![Download Windows Setup](https://img.shields.io/badge/Windows-NSIS%20Setup%20(.exe)-6366f1?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/alexandrmotologa/mcp-studio/releases/latest/download/MCP-Studio-Setup-2.1.8.exe)
[![Download Windows Portable](https://img.shields.io/badge/Windows-Portable%20(.exe)-4f46e5?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/alexandrmotologa/mcp-studio/releases/latest/download/MCP-Studio-Portable-2.1.8.exe)

</div>

---

## 🌟 Overview

**MCP Studio** is the flagship all-in-one developer IDE, inspector, automated testing suite, and protocol visualization platform for the **Model Context Protocol (MCP)**. Think of it as **Postman + Swagger + Fiddler** built specifically for AI agents, server architects, and tool creators.

Whether you're developing local MCP servers in **Python (FastMCP)**, **TypeScript (`@modelcontextprotocol/sdk`)**, **Go**, or **Rust** (`stdio` transport) or orchestrating production microservices over remote **HTTP/SSE**, MCP Studio delivers complete protocol visibility, real-time debugging, and automated developer tooling.

---

## 🏗️ Open Core Model & Licensing

MCP Studio follows a transparent **Open Core** architecture:

* **Community Edition (Open Source, MIT):**
  * The entire core application in this repository is open-source under the permissive **[MIT License](LICENSE)**.
  * Connect and orchestrate local (`stdio`) and remote (`sse`) MCP servers.
  * Interactive JSON Schema form generation with automatic mock parameter generation.
  * Multi-view response visualizer (JSON Tree, Smart Table, Markdown, Media).
  * Real-time packet-level JSON-RPC 2.0 traffic inspector with search and replay.
  * Client code generator for Python, TypeScript, cURL, Go, and Rust.
  * Studio Notification Dispatcher and 4-tab Notification Center.
  * Full developer freedom: clone, inspect, modify, and build locally.

* **Official Pre-compiled Binaries (Freemium):**
  * Pre-built desktop releases on [GitHub Releases](https://github.com/alexandrmotologa/mcp-studio/releases) and the [Official Website](https://mcp.mtlglabs.space) are free to use.
  * They optionally support unlocking advanced Pro/Enterprise capabilities (Multi-LLM Simulation Arena with Claude/GPT-4o/Ollama, Autonomous Assertion Test Suites, Concurrency & Latency Benchmarkers, Security Sandbox Auditor) via a license key.

---

## 🛠️ Developing & Building from Source

### Prerequisites
* **Node.js**: >= 20.0.0 (Node 22 recommended)
* **npm**: >= 10.0.0

### Quickstart

```bash
# 1. Clone the repository
git clone https://github.com/alexandrmotologa/mcp-studio.git
cd mcp-studio

# 2. Install dependencies
npm install

# 3. Launch in development mode with Hot Reload
npm run dev

# 4. Run automated test suites
npm test

# 5. Typecheck verification
npm run typecheck

# 6. Package desktop binaries locally
npm run build:win   # Windows NSIS Installer & Portable
npm run build:mac   # macOS DMG (Apple Silicon & Intel)
npm run build:linux # Linux AppImage & Debian package
```

---

## ⚡️ Core Features

* **🔍 Live Tool Inspection & Smart Mocking:** Dynamic JSON Schema forms, smart mock input generation, and multi-view output visualization.
* **⚡ JSON-RPC Traffic Bus:** Millisecond timestamped request/response correlation, latency tracking, and packet replay.
* **🔔 Notification Dispatcher & Notification Center:** Unified event bus with sound effects, relative timestamps, and categorized notification filters.
* **🛡️ Client Watchdog & Discovery:** Auto-detect local MCP server configurations from Claude Desktop and Cursor.
* **🎨 Modern Ergonomic Interface:** Handcrafted dark/light themes, command palette (`Ctrl+K`), live process logs.

---

## 📥 Downloads & Official Releases

Pre-compiled binary releases for Windows (Installer & Portable) are ready on:
* **[GitHub Releases](https://github.com/alexandrmotologa/mcp-studio/releases)**
* **[Official Website](https://mcp.mtlglabs.space)**

---

## 👨‍💻 Authors & Organization

* **Lead Architect:** [Alexandr Motologa](https://mtlg.site) ([LinkedIn](https://linkedin.com/in/alexandr-motologa) • [GitHub](https://github.com/alexandrmotologa))
* **Organization:** [MTLG Labs](https://mtlglabs.space)
* **Official Website:** [https://mcp.mtlglabs.space](https://mcp.mtlglabs.space)
* **Support & Inquiries:** `support@mtlglabs.space`

---

## 📄 License

The MCP Studio Community Edition source code is open-source software licensed under the **[MIT License](LICENSE)**.
