import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', 'src');
const ASSETS_IMG_DIR = path.resolve(__dirname, '..', 'assets', 'images');

// Sample dataset for realistic portfolio screenshots
const SAMPLE_DATA = {
  bench_items: [
    // Areas
    {
      id: 'area-1',
      type: 'area',
      name: 'Academics',
      description: 'Senior Year CS coursework and honors project.',
      icon: 'graduation-cap',
      color: 'blue',
      parentId: null,
      archived: false,
      createdAt: Date.now() - 86400000 * 30,
      updatedAt: Date.now() - 86400000 * 2
    },
    {
      id: 'area-2',
      type: 'area',
      name: 'Compiler Design',
      description: 'LLVM-based optimizer and code generation.',
      icon: 'cpu',
      color: 'purple',
      parentId: 'area-1',
      archived: false,
      createdAt: Date.now() - 86400000 * 20,
      updatedAt: Date.now() - 86400000 * 1
    },
    {
      id: 'area-3',
      type: 'area',
      name: 'Bench Core Engine',
      description: 'Local-first desktop command center and prioritization engine.',
      icon: 'layout-grid',
      color: 'green',
      parentId: null,
      archived: false,
      createdAt: Date.now() - 86400000 * 40,
      updatedAt: Date.now()
    },
    {
      id: 'area-4',
      type: 'area',
      name: 'Open Source',
      description: 'Public tools, documentation, and developer utilities.',
      icon: 'github',
      color: 'amber',
      parentId: null,
      archived: false,
      createdAt: Date.now() - 86400000 * 15,
      updatedAt: Date.now() - 86400000 * 3
    },

    // Tasks (Focus tasks - max 3 active)
    {
      id: 'task-1',
      title: 'Implement register allocation pass in LLVM backend',
      notes: 'Focus on linear scan allocator; verify with benchmark suite.',
      status: 'active',
      module: 'capture',
      focused: true,
      areaId: 'area-2',
      createdAt: Date.now() - 3600000 * 3,
      updatedAt: Date.now() - 3600000 * 1
    },
    {
      id: 'task-2',
      title: 'Harden Area cycle prevention in domain repository',
      notes: 'Unit test wouldCauseCycle with deep tree traversal.',
      status: 'active',
      module: 'capture',
      focused: true,
      areaId: 'area-3',
      createdAt: Date.now() - 3600000 * 5,
      updatedAt: Date.now() - 3600000 * 2
    },
    {
      id: 'task-3',
      title: 'Publish Bench v0.3.1 documentation and architecture diagrams',
      notes: 'Update README, ADR records, and API reference guides.',
      status: 'active',
      module: 'capture',
      focused: true,
      areaId: 'area-4',
      createdAt: Date.now() - 3600000 * 8,
      updatedAt: Date.now() - 3600000 * 2
    },

    // Completed tasks
    {
      id: 'task-4',
      title: 'Add zero-dependency Node.js unit test runner',
      notes: '17 tests covering repository, clips-store, and event bus.',
      status: 'completed',
      module: 'capture',
      focused: true,
      areaId: 'area-3',
      completedAt: Date.now() - 3600000 * 4,
      createdAt: Date.now() - 86400000 * 1,
      updatedAt: Date.now() - 3600000 * 4
    },
    {
      id: 'task-5',
      title: 'Design 15-palette color picker for visual clips notes',
      notes: 'Tokyo Night dark palette tones with normalized tags.',
      status: 'completed',
      module: 'capture',
      focused: false,
      areaId: 'area-3',
      completedAt: Date.now() - 86400000 * 1,
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 86400000 * 1
    },

    // Capture inbox
    {
      id: 'task-6',
      title: 'Explore SQLite persistence driver for v0.4.0 milestone',
      notes: 'Investigate rusqlite integration via Tauri commands.',
      status: 'active',
      module: 'capture',
      focused: false,
      areaId: 'area-3',
      createdAt: Date.now() - 3600000 * 6,
      updatedAt: Date.now() - 3600000 * 6
    },

    // Parking lot
    {
      id: 'task-7',
      title: 'Evaluate fuzzy search indexing algorithms (Bitap vs Levenshtein)',
      notes: 'Consider performance impact on 10,000+ items.',
      status: 'active',
      module: 'parking-lot',
      focused: false,
      areaId: 'area-4',
      createdAt: Date.now() - 86400000 * 4,
      updatedAt: Date.now() - 86400000 * 3
    }
  ],

  bench_clips: [
    {
      id: 'clip-1',
      title: 'Layered Domain Architecture',
      content: 'Documentation -> Domain -> Application -> Persistence -> Presentation.\n\nStrict rule: The Domain knows nothing about HTML, CSS, or Tauri.',
      tags: ['architecture', 'ddd', 'domain'],
      color: 'slate',
      pinned: true,
      archived: false,
      areaId: 'area-3',
      createdAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 86400000 * 1
    },
    {
      id: 'clip-2',
      title: 'LLVM IR Code Gen Snippet',
      content: '```llvm\ndefine i32 @add(i32 %a, i32 %b) {\n  %result = add i32 %a, %b\n  ret i32 %result\n}\n```\nVerify SSA form representation before register allocation pass.',
      tags: ['llvm', 'compiler', 'ir'],
      color: 'purple',
      pinned: true,
      archived: false,
      areaId: 'area-2',
      createdAt: Date.now() - 86400000 * 3,
      updatedAt: Date.now() - 86400000 * 2
    },
    {
      id: 'clip-3',
      title: 'Key Product Constraints',
      content: '1. Max 3 active Focus tasks\n2. Local-first persistence (zero remote telemetry)\n3. Pure keyboard-first navigation (Alt+1 to Alt+8)\n4. Calm monospace aesthetic',
      tags: ['philosophy', 'principles'],
      color: 'emerald',
      pinned: false,
      archived: false,
      areaId: 'area-3',
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 86400000 * 1
    },
    {
      id: 'clip-4',
      title: 'Keyboard Shortcuts Reference',
      content: '• Ctrl+K / Cmd+K: Command Palette\n• Ctrl+N / C: Quick Capture\n• Space: Complete Task\n• Alt+1-8: Direct Module Jump',
      tags: ['shortcuts', 'cheatsheet'],
      color: 'amber',
      pinned: false,
      archived: false,
      areaId: null,
      createdAt: Date.now() - 86400000 * 4,
      updatedAt: Date.now() - 86400000 * 1
    }
  ],

  bench_jot: `# Today's Focus & Sprint Goals

## Current Priorities (v0.3.1)
- [x] Integrate zero-dependency unit testing suite in \`tests/\`
- [x] Document ADRs 0005-0008 in \`docs/decisions/\`
- [ ] Finalize LLVM compiler assignment register allocator
- [ ] Review PR for Area deletion force reassignment

> "Your brain is for making decisions, not storing them."

### Architecture Reminders
The Domain layer must remain 100% decoupled from the UI framework. All state changes flow through the \`EventBus\` pub/sub bus.
`,

  bench_settings: {
    useSystemTheme: false,
    themeLevel: 1,
    theme: 'dark',
    accentColor: 'blue',
    compactMode: false,
    fontSize: 'medium',
    reduceAnimations: false,
    clipTaskTitles: true,
    shortcutStyle: 'windows',
    navigationIconStyle: 'bench-symbols'
  }
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function startServer(port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';
      const safePath = path.normalize(decodeURIComponent(reqPath)).replace(/^(\.\.[\/\\])+/, '');
      const filePath = path.join(ROOT_DIR, safePath);

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
      });
    });

    server.listen(port, () => {
      resolve(server);
    });
  });
}

function findBrowserPath() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (fs.existsSync(edgePath)) return edgePath;
  if (fs.existsSync(chromePath)) return chromePath;
  throw new Error('No Edge or Chrome browser found.');
}

async function sendCDPCommand(wsUrl, method, params = {}) {
  const WebSocket = (await import('node:http')).default;
  // Use http JSON API for simple evaluate / screenshot if possible, or standard CDP HTTP endpoints
}

async function captureWithCLI(browserPath, url, outputPath, width = 1280, height = 820, delayMs = 1500) {
  const args = [
    '--headless=new',
    '--disable-gpu',
    `--window-size=${width},${height}`,
    '--hide-scrollbars',
    `--screenshot=${outputPath}`,
    url
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn(browserPath, args, { stdio: 'ignore' });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Browser exited with code ${code}`));
    });
  });
}

async function main() {
  const port = 3847;
  const server = await startServer(port);
  const browserPath = findBrowserPath();

  if (!fs.existsSync(ASSETS_IMG_DIR)) {
    fs.mkdirSync(ASSETS_IMG_DIR, { recursive: true });
  }

  // Create an HTML runner that pre-seeds localStorage and switches to desired view
  const seedScript = `
    <script>
      localStorage.setItem('bench_items', ${JSON.stringify(JSON.stringify(SAMPLE_DATA.bench_items))});
      localStorage.setItem('bench_clips', ${JSON.stringify(JSON.stringify(SAMPLE_DATA.bench_clips))});
      localStorage.setItem('bench_jot', ${JSON.stringify(SAMPLE_DATA.bench_jot)});
      localStorage.setItem('bench_settings', ${JSON.stringify(JSON.stringify(SAMPLE_DATA.bench_settings))});
    </script>
  `;

  // Write temporary screenshot entrypoints
  const views = [
    { name: 'focus', module: 'focus', output: 'focus.png' },
    { name: 'areas', module: 'areas', output: 'areas.png' },
    { name: 'clips', module: 'clips', output: 'clips.png' },
    { name: 'jot', module: 'jot', output: 'jot.png' },
    { name: 'settings', module: 'settings', output: 'settings.png' }
  ];

  for (const view of views) {
    const htmlFile = path.join(ROOT_DIR, `_screenshot_${view.name}.html`);
    let originalHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

    const injection = `
      ${seedScript}
      <script type="module">
        import { initializeViewManager, navigateTo } from './core/view-manager.js';
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            navigateTo('${view.module}');
            ${view.triggerPalette ? `
              setTimeout(() => {
                const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
                window.dispatchEvent(event);
              }, 400);
            ` : ''}
            ${view.name === 'areas' ? `
              setTimeout(() => {
                const firstArea = document.querySelector('.area-tree-row');
                if (firstArea) firstArea.click();
              }, 400);
            ` : ''}
          }, 200);
        });
      </script>
    `;

    const modifiedHtml = originalHtml.replace('</head>', `${injection}</head>`);
    fs.writeFileSync(htmlFile, modifiedHtml, 'utf8');

    const targetUrl = `http://localhost:${port}/_screenshot_${view.name}.html`;
    const targetOutput = path.join(ASSETS_IMG_DIR, view.output);

    console.log(`Capturing ${view.name} -> ${view.output}...`);
    try {
      await captureWithCLI(browserPath, targetUrl, targetOutput, 1280, 820);
      console.log(`✓ Saved ${view.output}`);
    } catch (e) {
      console.error(`Failed to capture ${view.name}:`, e);
    }

    // Clean up temporary HTML file
    if (fs.existsSync(htmlFile)) {
      fs.unlinkSync(htmlFile);
    }
  }

  server.close();
  console.log('All screenshots captured successfully!');
}

main().catch(console.error);
