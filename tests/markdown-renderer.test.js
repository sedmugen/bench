import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, escapeHtml } from '../src/ui/markdown-renderer.js';

describe('MarkdownRenderer & XSS Sanitizer', () => {
  test('escapeHtml should properly encode HTML characters', () => {
    const raw = '<script>alert("xss")</script> & \'test\'';
    const escaped = escapeHtml(raw);
    assert.equal(escaped, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#039;test&#039;');
  });

  test('renderMarkdown should convert headers and lists safely', () => {
    const md = '# Title\n\n- Item 1\n- Item 2';
    const html = renderMarkdown(md);

    assert.ok(html.includes('<h1 class="md-h1">Title</h1>'));
    assert.ok(html.includes('<li>Item 1</li>'));
    assert.ok(html.includes('<li>Item 2</li>'));
  });

  test('renderMarkdown should convert inline formatting and code blocks', () => {
    const md = '**bold** and `code`\n\n```\nconst x = 1;\n```';
    const html = renderMarkdown(md);

    assert.ok(html.includes('<strong>bold</strong>'));
    assert.ok(html.includes('<code class="md-inline-code">code</code>'));
    assert.ok(html.includes('<pre class="md-code-block"><code>'));
    assert.ok(html.includes('const x = 1;'));
  });
});
