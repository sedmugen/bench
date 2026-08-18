# Build & Setup Guide

> **Official development, configuration, testing, and build reference for Bench.**

---

## 1. Supported Platforms & Environments

Bench targets cross-platform desktop environments via Tauri v2 and provides a lightweight browser development server:

- **Desktop (Native):** Windows 10/11, macOS (Intel & Apple Silicon), Linux (X11 & Wayland)
- **Web Browser (Local / Hosted):** Chrome, Edge, Firefox, Safari (zero-native dependencies required)

---

## 2. Prerequisites

Ensure the following toolchains are installed:

### 1. Node.js & Package Manager
- Node.js `v18.0.0+` (LTS recommended)
- `npm` (bundled with Node)

```bash
node --version
npm --version
```

### 2. Rust & Cargo
- Rust toolchain (`stable` channel via [rustup](https://rustup.rs/))

```bash
rustc --version
cargo --version
```

### 3. OS-Specific Build Dependencies (for Desktop Tauri builds)
- **Windows:** Visual Studio C++ Build Tools (with "Desktop development with C++" workload) and WebView2 (pre-installed on Windows 10/11).
- **macOS:** Xcode Command Line Tools (`xcode-select --install`).
- **Linux (Debian/Ubuntu):**
  ```bash
  sudo apt-get update
  sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
  ```

---

## 3. Clone & Installation

```bash
# Clone the repository
git clone https://github.com/sedmugen/bench.git
cd bench

# Copy environment template
cp .env.example .env

# Install development dependencies
npm install
```

---

## 4. Development Commands

### Web Browser Mode (Instant Start, No Rust Compilation)
Runs the standalone HTTP development server serving raw ES modules directly from `src/`:

```bash
npm run dev:web
# -> Application available at http://localhost:3000
```

### Desktop Mode (Tauri Native Host with Hot Reload)
Launches the native Tauri desktop shell with window chrome, custom drag region, and live webview reloading:

```bash
npm run tauri dev
```

---

## 5. Automated Testing

Bench includes a zero-dependency unit test suite executed via Node's native test runner:

```bash
npm test
```

### Test Coverage Areas:
- **`tests/repository.test.js`**: Task CRUD, 3-task Focus cap, Area cycle prevention (`wouldCauseCycle`), hierarchical path resolution, and safe force deletion.
- **`tests/clips-store.test.js`**: Tag normalization, multi-criteria sorting, and Area deletion cascades.
- **`tests/event-bus.test.js`**: Decoupled pub/sub event emission, unsubscription, and listener error resilience.
- **`tests/markdown-renderer.test.js`**: XSS escaping and GFM markdown compilation.

---

## 6. Production Binary Compilation

To compile production-optimized desktop binaries and platform installers:

```bash
npm run tauri build
```

Compiled application bundles will be generated in `src-tauri/target/release/bundle/`:
- **Windows:** `.msi` and `.exe` (NSIS) installers
- **macOS:** `.dmg` and `.app` bundles
- **Linux:** `.deb`, `.AppImage`, and `.tar.gz` packages

---

## 7. Troubleshooting

| Issue | Resolution |
|---|---|
| Port 3000 is occupied during `dev:web` | Specify custom port: `PORT=3005 npm run dev:web` |
| Tauri build fails with missing WebView2 / WebKit | Ensure OS prerequisites in Section 2 are installed |
| Stale local storage during testing | Execute `Repository.clearAll()` in DevTools console or use Settings -> Clear Database |
| Missing native build tools on Windows | Re-run Visual Studio Installer and ensure C++ Desktop workload is checked |