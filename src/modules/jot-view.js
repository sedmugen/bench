import { JotStore } from '../core/jot-store.js';
import { ToastService } from '../ui/toast.js';
import { SettingsStore } from '../core/settings-store.js';
import { renderMarkdown } from '../ui/markdown-renderer.js';

/**
 * Jot View Module
 * Provides a distraction-free space for free-form notes and thinking with live Markdown preview.
 */
export function renderJotView(container) {
  container.innerHTML = '';

  const settings = SettingsStore.load();
  let currentMode = settings.jotDefaultViewMode || 'edit'; // 'edit' | 'preview' | 'split'

  const containerWrapper = document.createElement('div');
  containerWrapper.className = 'jot-container';

  // Header Bar with Mode Switcher
  const headerBar = document.createElement('div');
  headerBar.className = 'jot-header-bar';

  const modeSwitcher = document.createElement('div');
  modeSwitcher.className = 'jot-mode-switcher';

  const modes = [
    { id: 'edit', label: 'Edit' },
    { id: 'preview', label: 'Preview' },
    { id: 'split', label: 'Split' }
  ];

  const modeButtons = {};

  modes.forEach(m => {
    const btn = document.createElement('button');
    btn.className = `jot-mode-btn ${currentMode === m.id ? 'active' : ''}`;
    btn.textContent = m.label;
    btn.setAttribute('tabindex', '-1');
    btn.addEventListener('click', () => {
      setMode(m.id);
    });
    modeSwitcher.appendChild(btn);
    modeButtons[m.id] = btn;
  });

  headerBar.appendChild(modeSwitcher);
  containerWrapper.appendChild(headerBar);

  // Main Workspace Area
  const workspace = document.createElement('div');
  workspace.className = 'jot-content-workspace';

  // Textarea Editor
  const textarea = document.createElement('textarea');
  textarea.className = 'jot-editor';
  textarea.placeholder = 'Write down your thoughts...';
  textarea.setAttribute('aria-label', 'Jot text editor');
  textarea.style.fontFamily = settings.jotFontFamily || 'monospace';
  textarea.value = JotStore.loadJot();

  // Preview Container
  const previewContainer = document.createElement('div');
  previewContainer.className = 'jot-preview-container';

  const updatePreview = () => {
    previewContainer.innerHTML = renderMarkdown(textarea.value);
  };

  // Editor Wrapper (with optional Gutter)
  let editorNode = textarea;
  if (settings.jotShowLineNumbers) {
    const editorWrapper = document.createElement('div');
    editorWrapper.className = 'jot-editor-wrapper';

    const gutter = document.createElement('div');
    gutter.className = 'jot-gutter';
    gutter.setAttribute('aria-hidden', 'true');
    gutter.style.fontFamily = settings.jotFontFamily || 'monospace';

    const updateLineNumbers = () => {
      const lineCount = textarea.value.split('\n').length;
      const lines = [];
      for (let i = 1; i <= lineCount; i++) {
        lines.push(i);
      }
      gutter.textContent = lines.join('\n');
    };

    textarea.addEventListener('input', updateLineNumbers);
    textarea.addEventListener('scroll', () => {
      gutter.scrollTop = textarea.scrollTop;
    });

    updateLineNumbers();

    editorWrapper.appendChild(gutter);
    editorWrapper.appendChild(textarea);
    editorNode = editorWrapper;
  }

  // Auto-save & Preview Update on Input
  textarea.addEventListener('input', () => {
    if (settings.jotAutoSave) {
      JotStore.saveJot(textarea.value);
    }
    if (currentMode !== 'edit') {
      updatePreview();
    }
  });

  textarea.addEventListener('blur', () => {
    JotStore.saveJot(textarea.value);
  });

  // Support Ctrl+S / Cmd+S manual save confirmation and Tab insertion
  textarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      JotStore.saveJot(textarea.value);
      ToastService.show('Saved.', 'success');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      
      let tabChar = '\t';
      if (settings.jotTabSize === '2') {
        tabChar = '  ';
      } else if (settings.jotTabSize === '4') {
        tabChar = '    ';
      }

      textarea.value = val.substring(0, start) + tabChar + val.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + tabChar.length;
      textarea.dispatchEvent(new Event('input'));
    }
  });

  function setMode(mode) {
    currentMode = mode;
    Object.keys(modeButtons).forEach(m => {
      modeButtons[m].classList.toggle('active', m === mode);
    });

    workspace.innerHTML = '';

    if (mode === 'edit') {
      workspace.appendChild(editorNode);
      requestAnimationFrame(() => textarea.focus());
    } else if (mode === 'preview') {
      updatePreview();
      workspace.appendChild(previewContainer);
    } else if (mode === 'split') {
      updatePreview();
      const splitWrapper = document.createElement('div');
      splitWrapper.className = 'jot-split-wrapper';
      splitWrapper.appendChild(editorNode);
      splitWrapper.appendChild(previewContainer);
      workspace.appendChild(splitWrapper);
      requestAnimationFrame(() => textarea.focus());
    }
  }

  // Set Initial View Mode Layout
  setMode(currentMode);

  containerWrapper.appendChild(workspace);
  container.appendChild(containerWrapper);
}
