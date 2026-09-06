# MCP Studio 🚀

<div align="center">

![MCP Studio Banner](https://raw.githubusercontent.com/alexandrmotologa/mcp-studio/main/icon.png)

### The Ultimate Desktop IDE, Inspector & Testing Platform for Model Context Protocol (MCP)

[![Release](https://img.shields.io/badge/release-v2.0.6-indigo.svg)](https://mcp.mtlglabs.space)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Electron](https://img.shields.io/badge/Electron-v34.2.0-47848F.svg?logo=electron&logoColor=white)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-v19.0.0-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.7.3-3178C6.svg?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-v1.6.0-purple.svg)](https://modelcontextprotocol.io)
[![Architecture](https://img.shields.io/badge/Architecture-Open%20Core-blueviolet.svg)](https://mcp.mtlglabs.space)

[🌐 Official Website](https://mcp.mtlglabs.space) • [🏢 MTLG Labs](https://mtlglabs.space) • [👨‍💻 Author Portfolio](https://mtlg.site) • [📥 Official Releases](https://mcp.mtlglabs.space) • [👔 LinkedIn](https://linkedin.com/in/alexandr-motologa)

</div>

---

## 🌟 Overview

**MCP Studio** is the flagship all-in-one developer IDE, inspector, automated testing suite, and AI agent simulation platform for the **Model Context Protocol (MCP)**. Think of it as **Postman + Swagger + Fiddler + Multi-LLM Simulation Arena** built specifically for AI agents, server architects, and tool creators.

Whether you're developing local MCP servers in **Python (FastMCP)**, **TypeScript (`@modelcontextprotocol/sdk`)**, **Go**, or **Rust** (`stdio` transport) or orchestrating production microservices over remote **HTTP/SSE**, MCP Studio delivers complete protocol visibility, real-time debugging, and automated CI/CD tooling.

---

## 🏗️ Open Core Model

MCP Studio follows an **Open Core** architecture:

* **Community Edition (Open Source):**
  * Full-featured MCP Client supporting **Stdio** and **Remote SSE** transports.
  * **Dynamic Schema Form Generator:** Visual interactive execution forms from JSON Schema specifications.
  * **Smart Mock Data Auto-Filler:** 1-Click parameter generation based on Faker analysis.
  * **Multi-View Response Visualizer:** Interactive JSON Tree, Smart Data Table, Markdown Previewer, and Base64 Media Viewer.
  * **Client Code Snippets:** Instant client execution code in Python, TypeScript, cURL, Go, and Rust.
  * **Live Process Console Drawer:** Real-time `stdout` and `stderr` logging with hot-restart capabilities.
  * **JSON-RPC Traffic Inspector:** Packet-level inspector with full search, filters, and replay.

* **Pro & Enterprise Edition (Proprietary Features):**
  * **Multi-LLM AI Agent Simulator:** Autonomous multi-turn reasoning with local Ollama, Claude 3.7 Sonnet, GPT-4o, Gemini 2.0 Flash, DeepSeek R1, Groq, and OpenRouter.
  * **AI Model Arena Shootout:** Side-by-side comparative benchmarking of two models executing identical tool prompts.
  * **15 Developer Power Tools:** Automated assertion test suites, concurrency & latency benchmarking, security sandbox auditor, in-memory mock MCP server engine, OpenAPI converter, Docker packager, remote ngrok tunnel bridge, session recorder, and workflow builder.
  * *Available at [https://mcp.mtlglabs.space](https://mcp.mtlglabs.space)*.

---

## ⚡️ Complete Feature Highlights (v2.0.6)

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

### 2. 📊 Protocol Telemetry & Analytics Dashboard
* **Real-Time Latency Percentiles:** Visual bar charts tracking live response latency (p50, p95, p99).
* **Reliability & Health Score:** Live percentage tracking error rates and failed RPC calls.
* **Token Footprint Estimator:** Estimates prompt tokens, schema overhead, and session token counts.
* **Live JSON-RPC Traffic Stream:** Real-time packet inspector with payload search, method filters, and 1-click replay.

### 3. 🎨 Design, Ergonomics & Themes
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

Community Edition is Open Source. Commercial & Pro Edition features are copyright © MTLG Labs. All rights reserved.
