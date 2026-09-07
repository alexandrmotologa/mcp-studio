## What's New in v2.1.3

### 🚀 Complete Multi-Platform Suite & Distribution
Release binaries are now fully built, notarized/packaged, and available across all major operating systems:
- **Windows**:
  - **Setup Installer (`.exe`)**: `MCP-Studio-Setup-2.1.3.exe` (with visible directory selection & extraction progress dialog)
  - **Portable Executable (`.exe`)**: `MCP-Studio-Portable-2.1.3.exe` (zero-install standalone version)
- **macOS Apple Silicon (M1/M2/M3/M4)**:
  - **DMG**: `MCP-Studio-2.1.3-arm64.dmg`
  - **ZIP**: `MCP-Studio-2.1.3-arm64.zip`
- **macOS Intel (x64)**:
  - **DMG**: `MCP-Studio-2.1.3-x64.dmg`
  - **ZIP**: `MCP-Studio-2.1.3-x64.zip`
- **Linux**:
  - **AppImage**: `MCP-Studio-2.1.3.AppImage`
  - **Debian / Ubuntu package**: `MCP-Studio-2.1.3.deb`

### 🛠️ Key Improvements & Fixes
- **NSIS Setup Wizard UX Fix**: Resolved an issue where Windows installations appeared to hang or run invisibly in the background without feedback. The installer now clearly displays the target destination screen and visible extraction progress bar.
- **Auto-Updater Channels**: Published full `latest.yml`, `latest-mac.yml`, and `latest-linux.yml` feeds enabling direct in-app "Check for Updates" detection from the public repository.
- **Showcase & Screenshot Showcase**: Updated live websites [mtlg.site](https://mtlg.site) and [mtlglabs.space](https://mtlglabs.space) with authentic workspace screenshots and responsive UI carousels.
