/**
 * Pure selection formatting utilities for native HTMLTextAreaElement.
 * Operates on textarea.selectionStart and textarea.selectionEnd without external dependencies.
 */

/**
 * Toggle prefix/suffix wrapping around selected text or current cursor word.
 * @param {HTMLTextAreaElement} textarea 
 * @param {string} prefix 
 * @param {string} suffix 
 */
export function toggleWrapSelection(textarea, prefix, suffix = prefix) {
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;
  const selectedText = val.substring(start, end);

  const prefixLen = prefix.length;
  const suffixLen = suffix.length;

  // Check if selection is already wrapped with prefix and suffix
  const isWrapped = 
    start >= prefixLen &&
    end + suffixLen <= val.length &&
    val.substring(start - prefixLen, start) === prefix &&
    val.substring(end, end + suffixLen) === suffix;

  if (isWrapped) {
    // Unwrap selection
    textarea.value = val.substring(0, start - prefixLen) + selectedText + val.substring(end + suffixLen);
    textarea.selectionStart = start - prefixLen;
    textarea.selectionEnd = end - prefixLen;
  } else if (start !== end && selectedText.startsWith(prefix) && selectedText.endsWith(suffix)) {
    // Unwrap internal selection
    const inner = selectedText.substring(prefixLen, selectedText.length - suffixLen);
    textarea.value = val.substring(0, start) + inner + val.substring(end);
    textarea.selectionStart = start;
    textarea.selectionEnd = start + inner.length;
  } else {
    // Wrap selection
    textarea.value = val.substring(0, start) + prefix + selectedText + suffix + val.substring(end);
    textarea.selectionStart = start + prefixLen;
    textarea.selectionEnd = end + prefixLen;
  }

  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
}

/**
 * Toggle line prefix (e.g., list bullet '- ', numbered '1. ', blockquote '> ') on current or selected lines.
 * @param {HTMLTextAreaElement} textarea 
 * @param {string} prefix 
 */
export function toggleLinePrefix(textarea, prefix) {
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;

  // Find start of first line and end of last line
  const lineStart = val.lastIndexOf('\n', start - 1) + 1;
  let lineEnd = val.indexOf('\n', end);
  if (lineEnd === -1) lineEnd = val.length;

  const linesText = val.substring(lineStart, lineEnd);
  const lines = linesText.split('\n');

  // Check if all selected lines already start with prefix
  const allPrefixed = lines.every(line => line.startsWith(prefix));

  const newLines = lines.map((line, idx) => {
    if (allPrefixed) {
      return line.substring(prefix.length);
    } else {
      if (prefix === '1. ') {
        return `${idx + 1}. ${line.replace(/^\d+\.\s+/, '').replace(/^[-*]\s+/, '').replace(/^>\s+/, '')}`;
      }
      return `${prefix}${line.replace(/^\d+\.\s+/, '').replace(/^[-*]\s+/, '').replace(/^>\s+/, '')}`;
    }
  });

  const newText = newLines.join('\n');
  textarea.value = val.substring(0, lineStart) + newText + val.substring(lineEnd);

  textarea.selectionStart = lineStart;
  textarea.selectionEnd = lineStart + newText.length;

  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
}
