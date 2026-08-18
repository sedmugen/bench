/**
 * Reusable Modal Overlay Frame
 * 
 * @param {object} options
 * @param {string} options.title - Modal header title
 * @param {HTMLElement|string} options.contentNode - Content element or HTML string to render
 * @param {function} [options.onClose] - Callback when modal is dismissed
 * @returns {object} - Exposes { close } function
 */
export function createModal({ title, contentNode, onClose, customClass }) {
  const portal = document.getElementById('overlay-portal');
  if (!portal) {
    console.error('Modal creation failed: #overlay-portal not found in DOM.');
    return null;
  }

  // Backdrop container
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  // Modal Frame
  const frame = document.createElement('div');
  frame.className = `modal-content ${customClass || ''}`.trim();

  // Header
  const header = document.createElement('div');
  header.className = 'modal-header';

  const titleEl = document.createElement('h2');
  titleEl.className = 'modal-title';
  titleEl.textContent = title;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close-btn';
  closeBtn.innerHTML = `&times;`;
  closeBtn.setAttribute('aria-label', 'Close modal');

  header.appendChild(titleEl);
  header.appendChild(closeBtn);

  // Body
  const body = document.createElement('div');
  body.className = 'modal-body';
  if (contentNode instanceof HTMLElement) {
    body.appendChild(contentNode);
  } else {
    body.innerHTML = contentNode;
  }

  frame.appendChild(header);
  frame.appendChild(body);
  backdrop.appendChild(frame);
  portal.appendChild(backdrop);

  // Focus trap / keyboard helper
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
    }
  };

  // Trigger CSS transition
  requestAnimationFrame(() => {
    backdrop.classList.add('fade-in');
  });

  window.addEventListener('keydown', handleKeyDown);

  function closeModal() {
    backdrop.classList.remove('fade-in');
    window.removeEventListener('keydown', handleKeyDown);
    
    // Wait for transition to complete before removing from DOM
    setTimeout(() => {
      if (portal.contains(backdrop)) {
        portal.removeChild(backdrop);
      }
      if (onClose) onClose();
    }, 150);
  }

  // Bind close triggers
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closeModal();
    }
  });

  return {
    close: closeModal,
    element: backdrop
  };
}
