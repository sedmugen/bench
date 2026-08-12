/**
 * Converts HTML DOM nodes from Jot's rendered preview back into GitHub Flavored Markdown.
 * @param {HTMLElement} element 
 * @returns {string}
 */
export function htmlToMarkdown(element) {
  if (!element) return '';

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const tagName = node.tagName.toLowerCase();
    const childrenText = Array.from(node.childNodes).map(processNode).join('');

    switch (tagName) {
      case 'h1':
        return `# ${childrenText.trim()}\n\n`;
      case 'h2':
        return `## ${childrenText.trim()}\n\n`;
      case 'h3':
        return `### ${childrenText.trim()}\n\n`;
      case 'h4':
        return `#### ${childrenText.trim()}\n\n`;
      case 'h5':
        return `##### ${childrenText.trim()}\n\n`;
      case 'h6':
        return `###### ${childrenText.trim()}\n\n`;
      case 'p':
        return `${childrenText}\n\n`;
      case 'strong':
      case 'b':
        return `**${childrenText}**`;
      case 'em':
      case 'i':
        return `_${childrenText}_`;
      case 'del':
      case 's':
      case 'strike':
        return `~~${childrenText}~~`;
      case 'code':
        if (node.parentElement && node.parentElement.tagName.toLowerCase() === 'pre') {
          return childrenText;
        }
        return `\`${childrenText}\``;
      case 'pre':
        return `\`\`\`\n${childrenText.trim()}\n\`\`\`\n\n`;
      case 'blockquote':
        return `> ${childrenText.trim().replace(/\n/g, '\n> ')}\n\n`;
      case 'ul':
        return `${Array.from(node.children).map(li => `- ${processNode(li).trim()}`).join('\n')}\n\n`;
      case 'ol':
        return `${Array.from(node.children).map((li, idx) => `${idx + 1}. ${processNode(li).trim()}`).join('\n')}\n\n`;
      case 'li':
        return childrenText;
      case 'a':
        const href = node.getAttribute('href') || '';
        return href ? `[${childrenText}](${href})` : childrenText;
      case 'hr':
        return `---\n\n`;
      case 'br':
        return `\n`;
      case 'div':
        return childrenText ? `${childrenText}\n` : '';
      default:
        return childrenText;
    }
  }

  const raw = Array.from(element.childNodes).map(processNode).join('');
  return raw.replace(/\n{3,}/g, '\n\n').trim();
}
