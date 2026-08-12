import { JotStore } from '../core/jot-store.js';
import { ToastService } from '../ui/toast.js';
import { SettingsStore } from '../core/settings-store.js';
import { renderMarkdown } from '../ui/markdown-renderer.js';
import { toggleWrapSelection, toggleLinePrefix } from '../ui/jot-formatter.js';
import { EventBus } from '../core/event-bus.js';
import { htmlToMarkdown } from '../ui/jot-html-parser.js';

/**
 * Jot View Module
 * Provides a distraction-free space for free-form notes with optional Markdown preview and text formatting.
 */
export function renderJotView(container) {
  container.innerHTML = '';

  const settings = SettingsStore.load();
  const isMarkdownEnabled = settings.enableJotMarkdown !== false;
  const isFormattingEnabled = settings.enableJotFormatting !== false && settings.jotShowFormattingToolbar !== false;

  let currentMode = isMarkdownEnabled ? (settings.jotDefaultViewMode || 'edit') : 'edit';

  const containerWrapper = document.createElement('div');
  containerWrapper.className = 'jot-container';

  const fontMap = {
    'jetbrains-mono': "'JetBrains Mono', monospace",
    'monospace': "'JetBrains Mono', monospace",
    'fira-code': "'Fira Code', monospace",
    'source-code-pro': "'Source Code Pro', monospace",
    'inter': "'Inter', sans-serif",
    'sans-serif': "'Inter', sans-serif",
    'system': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'lora': "'Lora', serif",
    'serif': "'Lora', serif",
    'merriweather': "'Merriweather', serif"
  };
  const initialFontVal = fontMap[settings.jotFontFamily] || fontMap['monospace'];

  // Header Bar with Mode Switcher (if Markdown is enabled)
  if (isMarkdownEnabled) {
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
  }

  // Textarea Editor
  const textarea = document.createElement('textarea');
  textarea.className = 'jot-editor';
  textarea.placeholder = 'Write down your thoughts...';
  textarea.setAttribute('spellcheck', settings.jotSpellCheck ? 'true' : 'false');
  textarea.style.fontFamily = initialFontVal;
  textarea.value = JotStore.loadJot();

  // Unified Formatting Application
  const applyFormatting = (actionType) => {
    const isPreviewActive = currentMode === 'preview' || (currentMode === 'split' && document.activeElement === previewContainer);

    if (isPreviewActive && previewContainer) {
      previewContainer.focus();
      switch (actionType) {
        case 'bold':
          document.execCommand('bold', false, null);
          break;
        case 'italic':
          document.execCommand('italic', false, null);
          break;
        case 'code':
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed) {
            const range = sel.getRangeAt(0);
            const codeEl = document.createElement('code');
            codeEl.className = 'md-inline-code';
            codeEl.appendChild(range.extractContents());
            range.insertNode(codeEl);
          }
          break;
        case 'strikethrough':
          document.execCommand('strikethrough', false, null);
          break;
        case 'list':
          document.execCommand('insertUnorderedList', false, null);
          break;
        case 'numberList':
          document.execCommand('insertOrderedList', false, null);
          break;
        case 'quote':
          document.execCommand('formatBlock', false, 'blockquote');
          break;
      }
      syncPreviewToTextarea();
    } else {
      switch (actionType) {
        case 'bold':
          toggleWrapSelection(textarea, '**');
          break;
        case 'italic':
          toggleWrapSelection(textarea, '_');
          break;
        case 'code':
          toggleWrapSelection(textarea, '`');
          break;
        case 'strikethrough':
          toggleWrapSelection(textarea, '~~');
          break;
        case 'list':
          toggleLinePrefix(textarea, '- ');
          break;
        case 'numberList':
          toggleLinePrefix(textarea, '1. ');
          break;
        case 'quote':
          toggleLinePrefix(textarea, '> ');
          break;
      }
    }
  };

  // Formatting Toolbar (if Formatting is enabled)
  if (isFormattingEnabled) {
    const toolbar = document.createElement('div');
    toolbar.className = 'jot-toolbar';

    const formatButtons = [
      { label: 'B', title: 'Bold (Ctrl+B)', actionType: 'bold' },
      { label: 'I', title: 'Italic (Ctrl+I)', actionType: 'italic' },
      { label: 'Code', title: 'Inline Code (Ctrl+E)', actionType: 'code' },
      { label: '~', title: 'Strikethrough (Ctrl+Shift+X)', actionType: 'strikethrough' },
      { label: 'List', title: 'Bulleted List (Ctrl+Shift+8)', actionType: 'list' },
      { label: '1.', title: 'Numbered List (Ctrl+Shift+7)', actionType: 'numberList' },
      { label: 'Quote', title: 'Blockquote (Ctrl+Shift+9)', actionType: 'quote' }
    ];

    formatButtons.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'jot-toolbar-btn';
      btn.textContent = item.label;
      btn.title = item.title;
      btn.setAttribute('tabindex', '-1');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        applyFormatting(item.actionType);
      });
      toolbar.appendChild(btn);
    });

    containerWrapper.appendChild(toolbar);
  }

  // Main Workspace Area
  const workspace = document.createElement('div');
  workspace.className = 'jot-content-workspace';

  // Preview Container (Editable)
  const previewContainer = document.createElement('div');
  previewContainer.className = 'jot-preview-container';
  previewContainer.setAttribute('contenteditable', 'true');
  previewContainer.setAttribute('aria-label', 'Jot rendered preview editor');

  let isEditingPreview = false;
  let updateLineNumbersFn = null;

  const updatePreview = () => {
    if (!isEditingPreview) {
      previewContainer.innerHTML = renderMarkdown(textarea.value);
    }
  };

  previewContainer.addEventListener('focus', () => {
    isEditingPreview = true;
  });

  const syncPreviewToTextarea = () => {
    const markdown = htmlToMarkdown(previewContainer);
    if (markdown !== textarea.value) {
      textarea.value = markdown;
      if (typeof updateLineNumbersFn === 'function') {
        updateLineNumbersFn();
      }
      if (settings.jotAutoSave) {
        JotStore.saveJot(markdown);
      }
    }
  };

  previewContainer.addEventListener('input', () => {
    syncPreviewToTextarea();
  });

  previewContainer.addEventListener('blur', () => {
    isEditingPreview = false;
    syncPreviewToTextarea();
    JotStore.saveJot(textarea.value);
    updatePreview();
  });

  // Editor Wrapper (with optional Gutter)
  let editorNode = textarea;
  let gutter = null;
  if (settings.jotShowLineNumbers) {
    const editorWrapper = document.createElement('div');
    editorWrapper.className = 'jot-editor-wrapper';

    gutter = document.createElement('div');
    gutter.className = 'jot-gutter';
    gutter.setAttribute('aria-hidden', 'true');
    gutter.style.fontFamily = initialFontVal;

    const updateLineNumbers = () => {
      const lineCount = textarea.value.split('\n').length;
      const lines = [];
      for (let i = 1; i <= lineCount; i++) {
        lines.push(i);
      }
      gutter.textContent = lines.join('\n');
    };
    updateLineNumbersFn = updateLineNumbers;

    textarea.addEventListener('input', updateLineNumbers);
    textarea.addEventListener('scroll', () => {
      gutter.scrollTop = textarea.scrollTop;
    });

    updateLineNumbers();

    editorWrapper.appendChild(gutter);
    editorWrapper.appendChild(textarea);
    editorNode = editorWrapper;
  }

  // Reactive settings change listener
  const handleSettingsChange = (newSettings) => {
    const newFontVal = fontMap[newSettings.jotFontFamily] || fontMap['monospace'];
    textarea.style.fontFamily = newFontVal;
    if (gutter) gutter.style.fontFamily = newFontVal;
  };
  EventBus.on('settingsChanged', handleSettingsChange);

  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      if (!document.body.contains(containerWrapper)) {
        EventBus.off('settingsChanged', handleSettingsChange);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Auto-save & Preview Update on Input
  textarea.addEventListener('input', () => {
    if (settings.jotAutoSave) {
      JotStore.saveJot(textarea.value);
    }
    if (isMarkdownEnabled && currentMode !== 'edit' && !isEditingPreview) {
      updatePreview();
    }
  });

  textarea.addEventListener('blur', () => {
    JotStore.saveJot(textarea.value);
  });

  // Keyboard Shortcuts Handler (Attached to both textarea & previewContainer)
  const handleKeydown = (e) => {
    const isCmdOrCtrl = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    if (isCmdOrCtrl && key === 's') {
      e.preventDefault();
      JotStore.saveJot(textarea.value);
      ToastService.show('Saved.', 'success');
    } else if (isFormattingEnabled && isCmdOrCtrl && !e.shiftKey && key === 'b') {
      e.preventDefault();
      applyFormatting('bold');
    } else if (isFormattingEnabled && isCmdOrCtrl && !e.shiftKey && key === 'i') {
      e.preventDefault();
      applyFormatting('italic');
    } else if (isFormattingEnabled && isCmdOrCtrl && !e.shiftKey && key === 'e') {
      e.preventDefault();
      applyFormatting('code');
    } else if (isFormattingEnabled && isCmdOrCtrl && e.shiftKey && key === 'x') {
      e.preventDefault();
      applyFormatting('strikethrough');
    } else if (isFormattingEnabled && isCmdOrCtrl && e.shiftKey && (e.key === '*' || key === '8')) {
      e.preventDefault();
      applyFormatting('list');
    } else if (isFormattingEnabled && isCmdOrCtrl && e.shiftKey && (e.key === '&' || key === '7')) {
      e.preventDefault();
      applyFormatting('numberList');
    } else if (isFormattingEnabled && isCmdOrCtrl && e.shiftKey && (e.key === '(' || key === '9')) {
      e.preventDefault();
      applyFormatting('quote');
    } else if (e.target === textarea && e.key === 'Tab') {
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
    } else if (e.target === textarea && e.key === 'Enter' && settings.jotSmartLists !== false && !e.shiftKey) {
      const start = textarea.selectionStart;
      const val = textarea.value;
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const currentLine = val.substring(lineStart, start);

      const listMatch = currentLine.match(/^(\s*)(-|\*|\+|\d+\.)\s+(.*)$/);
      if (listMatch) {
        const indent = listMatch[1];
        const marker = listMatch[2];
        const text = listMatch[3];

        if (text.trim() === '') {
          e.preventDefault();
          textarea.value = val.substring(0, lineStart) + val.substring(start);
          textarea.selectionStart = textarea.selectionEnd = lineStart;
          textarea.dispatchEvent(new Event('input'));
        } else {
          e.preventDefault();
          let nextMarker = marker;
          if (/^\d+\.$/.test(marker)) {
            const num = parseInt(marker, 10);
            nextMarker = `${num + 1}.`;
          }
          const insertion = `\n${indent}${nextMarker} `;
          textarea.value = val.substring(0, start) + insertion + val.substring(start);
          textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
          textarea.dispatchEvent(new Event('input'));
        }
      }
    }
  };

  textarea.addEventListener('keydown', handleKeydown);
  previewContainer.addEventListener('keydown', handleKeydown);

  function setMode(mode) {
    if (!isMarkdownEnabled) mode = 'edit';
    currentMode = mode;

    const modeButtonsNode = containerWrapper.querySelectorAll('.jot-mode-btn');
    modeButtonsNode.forEach(btn => {
      btn.classList.toggle('active', btn.textContent.toLowerCase() === mode);
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
