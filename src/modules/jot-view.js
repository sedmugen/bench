import { JotStore } from '../core/jot-store.js';
import { ToastService } from '../ui/toast.js';
import { SettingsStore } from '../core/settings-store.js';
import { toggleWrapSelection, toggleLinePrefix } from '../ui/jot-formatter.js';

/**
 * Jot View Module
 * Provides a distraction-free space for free-form notes and thinking.
 */
export function renderJotView(container) {
  container.innerHTML = '';

  const settings = SettingsStore.load();

  const containerWrapper = document.createElement('div');
  containerWrapper.className = 'jot-container';

  // Build Formatting Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'jot-toolbar';

  const formatButtons = [
    { label: 'B', title: 'Bold (Ctrl+B)', action: (ta) => toggleWrapSelection(ta, '**') },
    { label: 'I', title: 'Italic (Ctrl+I)', action: (ta) => toggleWrapSelection(ta, '_') },
    { label: 'Code', title: 'Inline Code (Ctrl+E)', action: (ta) => toggleWrapSelection(ta, '`') },
    { label: '~', title: 'Strikethrough (Ctrl+Shift+X)', action: (ta) => toggleWrapSelection(ta, '~~') },
    { label: 'List', title: 'Bulleted List (Ctrl+Shift+8)', action: (ta) => toggleLinePrefix(ta, '- ') },
    { label: '1.', title: 'Numbered List (Ctrl+Shift+7)', action: (ta) => toggleLinePrefix(ta, '1. ') },
    { label: 'Quote', title: 'Blockquote (Ctrl+Shift+9)', action: (ta) => toggleLinePrefix(ta, '> ') }
  ];

  const textarea = document.createElement('textarea');
  textarea.className = 'jot-editor';
  textarea.placeholder = 'Write down your thoughts...';
  textarea.setAttribute('aria-label', 'Jot text editor');

  formatButtons.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'jot-toolbar-btn';
    btn.textContent = item.label;
    btn.title = item.title;
    btn.setAttribute('tabindex', '-1');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      item.action(textarea);
    });
    toolbar.appendChild(btn);
  });

  if (settings.jotShowFormattingToolbar !== false) {
    containerWrapper.appendChild(toolbar);
  }

  // Apply Font Family configuration
  textarea.style.fontFamily = settings.jotFontFamily || 'monospace';

  // Restore saved content
  textarea.value = JotStore.loadJot();

  // Auto-save on input (if enabled)
  textarea.addEventListener('input', () => {
    if (settings.jotAutoSave) {
      JotStore.saveJot(textarea.value);
    }
  });

  // Also save on blur to protect user data from view switching loss
  textarea.addEventListener('blur', () => {
    JotStore.saveJot(textarea.value);
  });

  // Support Ctrl+S / Cmd+S manual save confirmation, formatting shortcuts, and Tab insertion
  textarea.addEventListener('keydown', (e) => {
    const isCmdOrCtrl = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    if (isCmdOrCtrl && key === 's') {
      e.preventDefault();
      JotStore.saveJot(textarea.value);
      ToastService.show('Saved.', 'success');
    } else if (isCmdOrCtrl && !e.shiftKey && key === 'b') {
      e.preventDefault();
      toggleWrapSelection(textarea, '**');
    } else if (isCmdOrCtrl && !e.shiftKey && key === 'i') {
      e.preventDefault();
      toggleWrapSelection(textarea, '_');
    } else if (isCmdOrCtrl && !e.shiftKey && key === 'e') {
      e.preventDefault();
      toggleWrapSelection(textarea, '`');
    } else if (isCmdOrCtrl && e.shiftKey && key === 'x') {
      e.preventDefault();
      toggleWrapSelection(textarea, '~~');
    } else if (isCmdOrCtrl && e.shiftKey && e.key === '*') {
      e.preventDefault();
      toggleLinePrefix(textarea, '- ');
    } else if (isCmdOrCtrl && e.shiftKey && e.key === '&') {
      e.preventDefault();
      toggleLinePrefix(textarea, '1. ');
    } else if (isCmdOrCtrl && e.shiftKey && e.key === '(') {
      e.preventDefault();
      toggleLinePrefix(textarea, '> ');
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
      
      // Dispatch input event to trigger auto-save (if enabled)
      textarea.dispatchEvent(new Event('input'));
    }
  });

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

    // Populate initial lines
    updateLineNumbers();

    editorWrapper.appendChild(gutter);
    editorWrapper.appendChild(textarea);
    containerWrapper.appendChild(editorWrapper);
  } else {
    containerWrapper.appendChild(textarea);
  }

  container.appendChild(containerWrapper);

  // Focus the editor
  requestAnimationFrame(() => {
    textarea.focus();
  });
}
