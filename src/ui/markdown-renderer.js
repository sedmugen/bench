/**
 * Lightweight, zero-dependency Markdown renderer.
 * Converts GFM plain text into safe HTML strings with XSS escaping.
 */

/**
 * Escape raw HTML entities to prevent XSS attacks.
 * @param {string} str 
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render Markdown text to HTML.
 * @param {string} markdown 
 * @returns {string}
 */
export function renderMarkdown(markdown) {
  if (!markdown) return '';

  // Store fenced code blocks before escaping HTML
  const codeBlocks = [];
  let text = markdown.replace(/```([\s\S]*?)```/g, (match, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(code);
    return placeholder;
  });

  // Escape HTML entities in raw text
  text = escapeHtml(text);

  // Restore code blocks with escaping applied to code contents
  text = text.replace(/__CODE_BLOCK_(\d+)__/g, (match, idx) => {
    const code = escapeHtml(codeBlocks[parseInt(idx, 10)]);
    return `<pre class="md-code-block"><code>${code}</code></pre>`;
  });

  const lines = text.split('\n');
  const result = [];
  let inList = false;
  let listType = null; // 'ul' or 'ol'
  let inBlockquote = false;

  lines.forEach((line) => {
    // Process blockquotes
    if (line.startsWith('&gt; ') || line.startsWith('> ')) {
      if (!inBlockquote) {
        if (inList) { result.push(`</${listType}>`); inList = false; }
        result.push('<blockquote class="md-quote">');
        inBlockquote = true;
      }
      const quoteText = processInline(line.replace(/^(&gt;|>)\s?/, ''));
      result.push(`<p>${quoteText}</p>`);
      return;
    } else if (inBlockquote) {
      result.push('</blockquote>');
      inBlockquote = false;
    }

    // Process unordered lists (- or *)
    const ulMatch = line.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) result.push(`</${listType}>`);
        result.push('<ul class="md-list">');
        inList = true;
        listType = 'ul';
      }
      result.push(`<li>${processInline(ulMatch[1])}</li>`);
      return;
    }

    // Process ordered lists (1. 2. etc)
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) result.push(`</${listType}>`);
        result.push('<ol class="md-list">');
        inList = true;
        listType = 'ol';
      }
      result.push(`<li>${processInline(olMatch[1])}</li>`);
      return;
    }

    // Close open list if line is not a list item
    if (inList) {
      result.push(`</${listType}>`);
      inList = false;
      listType = null;
    }

    // Process Headings (# through ######)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      result.push(`<h${level} class="md-h${level}">${processInline(headingMatch[2])}</h${level}>`);
      return;
    }

    // Horizontal Rule (--- or ***)
    if (/^(---|\*\*\*|___)\s*$/.test(line)) {
      result.push('<hr class="md-hr">');
      return;
    }

    // Code blocks passed through earlier
    if (line.includes('<pre class="md-code-block">')) {
      result.push(line);
      return;
    }

    // Empty lines
    if (line.trim() === '') {
      result.push('<br>');
      return;
    }

    // Standard Paragraph
    result.push(`<p class="md-p">${processInline(line)}</p>`);
  });

  if (inList) result.push(`</${listType}>`);
  if (inBlockquote) result.push('</blockquote>');

  return result.join('\n');
}

/**
 * Process inline Markdown syntax (Bold, Italic, Strikethrough, Code, Links).
 * @param {string} text 
 * @returns {string}
 */
function processInline(text) {
  if (!text) return '';

  return text
    // Inline code (`code`)
    .replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
    // Bold (**text**)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Strikethrough (~~text~~)
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    // Italic (*text* or _text_)
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    // Links [title](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>');
}
