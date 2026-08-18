const ICONS = {
  success: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
};

/**
 * ToastService displays lightweight, non-blocking notifications.
 *
 * Supports an optional action button (e.g. "Undo") that calls a callback
 * and dismisses the toast immediately.
 */
export const ToastService = {
  /**
   * @param {string} message
   * @param {'success'|'error'|'info'} [type='info']
   * @param {number} [duration=3000]
   * @param {{ label: string, callback: Function }} [action]
   */
  show(message, type = 'info', duration = 3000, action = null) {
    if (typeof document === 'undefined') return;
    const portal = document.getElementById('toast-portal');
    if (!portal) return;

    let container = portal.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      portal.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;

    const icon = ICONS[type] || ICONS.info;

    toast.innerHTML = `${icon}<span>${message}</span>`;

    // Optional action button (e.g. "Undo")
    if (action && action.label && action.callback) {
      const btn = document.createElement('button');
      btn.className = 'toast-action';
      btn.textContent = action.label;
      btn.addEventListener('click', () => {
        action.callback();
        dismiss();
      });
      toast.appendChild(btn);
    }

    container.appendChild(toast);

    function dismiss() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px) scale(0.98)';
      setTimeout(() => {
        if (container.contains(toast)) container.removeChild(toast);
        if (container.childNodes.length === 0 && portal.contains(container)) {
          portal.removeChild(container);
        }
      }, 200);
    }

    const timer = setTimeout(dismiss, duration);

    // If the action button is clicked, cancel the auto-dismiss
    if (action) {
      toast.querySelector('.toast-action')?.addEventListener('click', () => clearTimeout(timer), { once: true });
    }
  }
};
