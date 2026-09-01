# MCP Studio 🚀

<div align="center">

![MCP Studio Banner](https://raw.githubusercontent.com/alexandrmotologa/mcp-studio-core/main/resources/icon.png)

### The Ultimate Desktop IDE, AI Simulator & Developer Suite for Model Context Protocol (MCP)

[![Release](https://img.shields.io/badge/release-v2.0.0-indigo.svg)](https://github.com/alexandrmotologa/mcp-studio-core/releases)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Electron](https://img.shields.io/badge/Electron-v34.2.0-47848F.svg?logo=electron&logoColor=white)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-v19.0.0-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.7.3-3178C6.svg?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-v1.6.0-purple.svg)](https://modelcontextprotocol.io)
[![License](https://img.shields.io/badge/license-Commercial-blue.svg)](LICENSE)

[🌐 Official Website](https://mcp.mtlglabs.space) • [🏢 MTLG Labs](https://mtlglabs.space) • [👨‍💻 Author Portfolio](https://mtlg.site) • [📥 Download Releases](https://github.com/alexandrmotologa/mcp-studio-core/releases) • [👔 LinkedIn](https://linkedin.com/in/alexandr-motologa)

</div>

---

## 🌟 Overview

**MCP Studio** is the flagship all-in-one developer IDE, inspector, automated testing suite, and AI agent simulation platform for the **Model Context Protocol (MCP)**. Think of it as **Postman + Swagger + Fiddler + Multi-LLM Simulation Arena** built specifically for AI agents, server architects, and tool creators.

Whether you're developing local MCP servers in **Python (FastMCP)**, **TypeScript (`@modelcontextprotocol/sdk`)**, **Go**, or **Rust** (`stdio` transport) or orchestrating production microservices over remote **HTTP/SSE**, MCP Studio delivers complete protocol visibility, real-time debugging, and automated CI/CD tooling.

---

## ⚡️ Complete Feature Matrix (v2.0.0)

### 1. 🔍 Live Tool Inspection & Smart Mocking
* **Dynamic Form Generator:** Automatically analyzes JSON Schema property definitions into interactive input forms with field validation and `Ctrl+Enter` immediate execution.
* **🎲 Smart Mock Data Auto-Filler:** Intelligent Faker engine analyzing parameter keywords (`email`, `sql`, `uuid`, `path`, `timestamp`, `name`, `limit`, etc.) to auto-populate forms in 1 click.
* **Multi-View Response Visualizer:**
  * 🌲 **Interactive JSON Tree View:** Expandable nodes with syntax highlighting and 1-click path copying.
  * 📊 **Smart Table View:** Auto-detects arrays of objects (SQL queries, API responses) with instant search and column sorting.
  * 📝 **Markdown Previewer:** Rich formatted preview for markdown and text outputs.
  * 🖼️ **Base64 Media & File Viewer:** Visual rendering for base64 images, PDFs, and assets with 1-click download.
* **Client Code Snippets Generator:** Generates copy-pasteable client execution code in **Python (`mcp.ClientSession`)**, **TypeScript**, **cURL (JSON-RPC 2.0)**, **Go (`mcp-go`)**, and **Rust (`mcp-sdk-rs`)**.
* **Live Process Console Drawer:** Real-time terminal capturing `stdout` and `stderr` stream output from child processes with hot-restart capabilities.

### 2. 🧠 Multi-LLM AI Agent Simulator & Model Arena
* **Offline Local Ollama Integration:** Native support for local Ollama instances (`http://localhost:11434`), verified with `llama3:8b`, `qwen2.5-coder`, and `deepseek-r1`.
* **Frontier Cloud Providers:** Anthropic Claude (Claude 3.7 Sonnet, 3.5 Haiku), OpenAI (GPT-4o, o3-mini), Google Gemini 2.0 (Flash & Pro), DeepSeek R1, Groq, Mistral, and OpenRouter.
* **⚔️ AI Model Arena Shootout:** Execute identical tool prompts simultaneously on two distinct models side-by-side to benchmark reasoning latency and tool-calling accuracy.
* **🪄 AI Tool Prompt & Boundary Optimizer:** Analyzes tool schemas from the perspective of frontier LLMs and generates optimized system boundary prompts.
* **🛡️ Schema Linter & Quality Auditor:** Evaluates schemas against Anthropic & OpenAI standards, calculating a **Health Score (0–100 A+)** and highlighting missing descriptions or untyped parameters.

### 3. 🧰 Developer Power Toolkit Hub (15 Specialized Tools)
Centralized in a dedicated command center modal and global command palette:
1. 🧪 **Assertion Test Suites:** Automated regression runner for status codes, latency limits, and deep payload assertions.
2. ⚡ **Concurrency & Latency Benchmark:** Stress-test MCP tools with concurrent workers to measure p50/p95/p99 latency and RPS throughput.
3. 🛡️ **Security & Sandbox Isolation Auditor:** Static security scanner detecting secret leaks, path traversals, and dangerous shell injection wrappers.
4. 🤖 **In-Memory Mock MCP Server Engine:** Spawn simulated offline servers with custom fixture responses and artificial latency.
5. ⚔️ **AI Model Arena Shootout:** Side-by-side multi-LLM comparative benchmarking.
6. 📁 **Server Project Scaffolder:** 1-Click boilerplate generator for production-ready MCP servers in Python (FastMCP), TypeScript, or Go.
7. 🔀 **Visual Workflow Pipelines:** Chain multiple MCP tools sequentially with dynamic variable passing (`{{steps[0].result.id}}`).
8. 🔍 **Schema Diff & Changelog Tracker:** Compare tool schemas across versions or environments and generate Markdown release changelogs.
9. 📄 **OpenAPI to MCP Transpiler:** Convert REST API Swagger/OpenAPI 3.0 specifications directly into executable MCP server definitions.
10. 📖 **Interactive API Documentation Generator:** Generate and export developer documentation in Markdown and standalone HTML.
11. 💓 **Process Health & Memory Watchdog:** Real-time supervisor tracking sub-process CPU, RSS memory, uptime, and automatic deadlock recovery.
12. 🛡️ **MCP Gateway & Traffic Interceptor:** Set live JSON-RPC breakpoints to inspect/modify tool parameters and configure mock override rules.
13. 📦 **Docker & Cloud Deployment Packager:** Generate multi-stage Dockerfiles, `docker-compose.yml`, `fly.toml`, and Kubernetes manifests.
14. 📡 **Remote SSE Bridge & Ngrok Tunnel:** Connect remote SSE endpoints and expose local stdio servers over secure public reverse tunnels.
15. 🎥 **Interactive Session Recorder & Replayer:** Record debugging sessions and export portable `.mcpsession` bundles for team collaboration.

### 4. 📊 Protocol Telemetry & Analytics Dashboard
* **Real-Time Latency Percentiles:** Visual bar charts tracking live response latency (p50, p95, p99).
* **Reliability & Health Score:** Live percentage tracking error rates and failed RPC calls.
* **Token Footprint Estimator:** Estimates prompt tokens, schema overhead, and session token counts.
* **Live JSON-RPC Traffic Stream:** Real-time packet inspector with payload search, method filters, and 1-click replay.

### 5. 🎨 Design, Ergonomics & Themes
* **Modern 3-Zone Linear-Style Header:** Clean brand identity, omnibar search, core workspace tabs, and a compact 4-anchor control deck.
* **7 Handcrafted Themes:**
  * 🌌 **Cyberpunk Indigo** (Default Navy Dark)
  * 🖤 **Midnight OLED True Black** (#000000 high-contrast)
  * 🟢 **Emerald Matrix** (Hacker Neon)
  * 🟣 **Dracula Slate** (Modern Purple Dark)
  * ☀️ **Nordic Clean Light** (Minimalist White & Sky-Slate)
  * 📄 **GitHub Crisp White** (High-Contrast Documentation Light)
  * 📜 **Solarized Warm Cream** (Sepia/Cream eye-strain reduction)
* **High-Contrast Light Mode Layer:** Soft pastel badges, crisp typography (`#1e293b`), and zero dark-gradient artifacts.
* **Audio FX Sound Engine:** Real-time Web Audio API sound synthesis for clicks, successes, and warnings.
* **Global Command Palette (`Ctrl+K`):** Fuzzy search across all tools, resources, prompts, servers, and power actions.
* **Full Responsive Adaptation:** Designed and tested down to **700px** minimal width.

---

## 👨‍💻 Authors & Organization

* **Lead Architect:** [Alexandr Motologa](https://mtlg.site) ([LinkedIn](https://linkedin.com/in/alexandr-motologa) • [GitHub](https://github.com/alexandrmotologa))
* **Organization:** [MTLG Labs](https://mtlglabs.space)
* **Official Website:** [https://mcp.mtlglabs.space](https://mcp.mtlglabs.space)
* **Support & Contact:** `alexander@mtlglabs.space`

---

## 📄 License

Commercial Proprietary Software — Developed by Alexandr Motologa & MTLG Labs. All rights reserved.
