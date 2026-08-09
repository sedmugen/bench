const registry = new Map();

/**
 * CommandRegistry handles dynamic registration of command palette items.
 * This allows modules (like Focus, Capture, Settings) to inject their own
 * contextual commands without modifying the Command Palette codebase itself.
 */
export const CommandRegistry = {
  /**
   * Register a new command.
   * @param {object} command
   * @param {string} command.id - Unique identifier (e.g. 'nav-focus', 'focus-start-fresh')
   * @param {string} command.label - Human-readable action description
   * @param {string} command.category - Group name (e.g. 'Navigation', 'Actions')
   * @param {function} command.action - Callback function executed on selection
   * @param {string} [command.shortcut] - Keyboard shortcut hint
   * @param {string} [command.icon] - Inline SVG icon markup
   */
  register(command) {
    if (!command.id || !command.label || !command.action) {
      console.warn('Command registration failed: missing id, label, or action.', command);
      return;
    }
    registry.set(command.id, command);
  },

  /**
   * Unregister an existing command.
   * @param {string} commandId
   */
  unregister(commandId) {
    registry.delete(commandId);
  },

  /**
   * Get all registered commands as an array.
   * @returns {Array<object>}
   */
  getAll() {
    return Array.from(registry.values());
  }
};
