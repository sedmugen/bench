import { createModal } from './modal.js';
import { SettingsStore } from '../core/settings-store.js';
import { ModuleRegistry } from '../core/module-registry.js';

/**
 * Display the lightweight Keyboard Shortcuts modal overlay
 */
export function showShortcutsModal() {
  const settings = SettingsStore.load();
  const isMac = settings.shortcutStyle === 'mac';

  const format = (win, mac) => {
    if (isMac) {
      return `<span style="color: var(--color-text-muted); font-weight: normal;">${win}</span> <span style="color: var(--color-text-muted); font-weight: normal; margin: 0 4px;">/</span> <span>${mac}</span>`;
    } else {
      return `<span>${win}</span> <span style="color: var(--color-text-muted); font-weight: normal; margin: 0 4px;">/</span> <span style="color: var(--color-text-muted); font-weight: normal;">${mac}</span>`;
    }
  };

  const currentSettings = SettingsStore.load();
  const iconStyle = currentSettings.navigationIconStyle || 'bench-symbols';
  const getGraphic = (id) => ModuleRegistry.renderGraphic(id, iconStyle);

  const content = `
    <div class="shortcuts-modal-container">
      <div class="shortcuts-group-title">Global Navigation</div>
      <table class="shortcuts-table">
        <tr><td class="shortcuts-key">${format('Ctrl+N / C', '⌘N / C')}</td><td class="shortcuts-desc">Open Quick Capture</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+1', '⌥1')}</td><td class="shortcuts-desc">Go to Focus (${getGraphic('focus')})</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+2', '⌥2')}</td><td class="shortcuts-desc">Go to Capture (${getGraphic('capture')})</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+3', '⌥3')}</td><td class="shortcuts-desc">Go to Areas (${getGraphic('areas')})</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+4', '⌥4')}</td><td class="shortcuts-desc">Go to Parking Lot (${getGraphic('parking-lot')})</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+5', '⌥5')}</td><td class="shortcuts-desc">Go to Archive (${getGraphic('archive')})</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+6', '⌥6')}</td><td class="shortcuts-desc">Go to Jot (${getGraphic('jot')})</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+7', '⌥7')}</td><td class="shortcuts-desc">Go to Log (${getGraphic('recap')})</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+8', '⌥8')}</td><td class="shortcuts-desc">Go to Clips (${getGraphic('clips')})</td></tr>
        <tr><td class="shortcuts-key">${format('Ctrl+J', '⌘J')}</td><td class="shortcuts-desc">Go to Settings</td></tr>
        <tr><td class="shortcuts-key">${format('Ctrl+L', '⌘L')}</td><td class="shortcuts-desc">Toggle Sidebar</td></tr>
        <tr><td class="shortcuts-key">Escape</td><td class="shortcuts-desc">Close active overlay / modal</td></tr>
      </table>
      
      <div class="shortcuts-group-title">Task List Navigation & Actions</div>
      <table class="shortcuts-table">
        <tr><td class="shortcuts-key">Arrow Up / Down</td><td class="shortcuts-desc">Move selection</td></tr>
        <tr><td class="shortcuts-key">Enter / E</td><td class="shortcuts-desc">Edit selected item inline</td></tr>
        <tr><td class="shortcuts-key">Space</td><td class="shortcuts-desc">Toggle completion of selected item</td></tr>
        <tr><td class="shortcuts-key">F</td><td class="shortcuts-desc">Move selected item to Focus</td></tr>
        <tr><td class="shortcuts-key">P</td><td class="shortcuts-desc">Move selected item to Parking Lot</td></tr>
        <tr><td class="shortcuts-key">A</td><td class="shortcuts-desc">Move selected item to Archive</td></tr>
        <tr><td class="shortcuts-key">D / Delete</td><td class="shortcuts-desc">Delete selected item</td></tr>
        <tr><td class="shortcuts-key">R</td><td class="shortcuts-desc">Restore item (Archive)</td></tr>
      </table>

      <div class="shortcuts-group-title">Clips Navigation & Actions</div>
      <table class="shortcuts-table">
        <tr><td class="shortcuts-key">N / C</td><td class="shortcuts-desc">Focus new clip creation input</td></tr>
        <tr><td class="shortcuts-key">/</td><td class="shortcuts-desc">Focus live search filter</td></tr>
        <tr><td class="shortcuts-key">j / k / Arrows</td><td class="shortcuts-desc">Navigate selection across clip cards</td></tr>
        <tr><td class="shortcuts-key">Enter / E</td><td class="shortcuts-desc">Edit selected clip inline</td></tr>
        <tr><td class="shortcuts-key">P</td><td class="shortcuts-desc">Toggle pin on selected clip</td></tr>
        <tr><td class="shortcuts-key">A</td><td class="shortcuts-desc">Archive or restore selected clip</td></tr>
        <tr><td class="shortcuts-key">D / Delete</td><td class="shortcuts-desc">Delete selected clip</td></tr>
        <tr><td class="shortcuts-key">${format('Ctrl+Enter', '⌘Enter')}</td><td class="shortcuts-desc">Save new clip or commit inline edits</td></tr>
        <tr><td class="shortcuts-key">Escape</td><td class="shortcuts-desc">Clear search / cancel edit / deselect</td></tr>
      </table>
      
      <div class="shortcuts-group-title">Inspector & Notes Editor</div>
      <table class="shortcuts-table">
        <tr><td class="shortcuts-key">${format('Ctrl+T', '⌘T')}</td><td class="shortcuts-desc">Focus title field</td></tr>
        <tr><td class="shortcuts-key">${format('Ctrl+Enter', '⌘Enter')}</td><td class="shortcuts-desc">Save changes & return focus to list</td></tr>
        <tr><td class="shortcuts-key">${format('Ctrl+S', '⌘S')}</td><td class="shortcuts-desc">Force immediate save</td></tr>
        <tr><td class="shortcuts-key">Escape</td><td class="shortcuts-desc">Blur editor first / close Inspector</td></tr>
        <tr><td class="shortcuts-key">Tab</td><td class="shortcuts-desc">Insert 2 spaces</td></tr>
      </table>
    </div>
  `;

  createModal({
    title: 'keyboard shortcuts',
    contentNode: content
  });
}

/**
 * Display the Bench Guide overview modal
 */
export function showBenchGuide() {
  const entry = (term, desc) =>
    `<div class="guide-entry"><span class="guide-term">${term}</span><span class="guide-desc">${desc}</span></div>`;

  const content = `
    <div class="shortcuts-modal-container">

      <div class="shortcuts-group-title">The Workflow</div>
      <p class="guide-intro">Bench follows one simple loop: capture everything, organise it into areas, pick your three tasks for today, and work through them.</p>
      <div class="guide-workflow">
        <span class="guide-step">Capture</span>
        <span class="guide-arrow">→</span>
        <span class="guide-step">Organise</span>
        <span class="guide-arrow">→</span>
        <span class="guide-step">Focus</span>
        <span class="guide-arrow">→</span>
        <span class="guide-step">Complete</span>
      </div>

      <div class="shortcuts-group-title">Core Concepts</div>
      ${entry('Capture', 'Your inbox. Dump any idea, task, or thought here the moment it appears. Don\'t judge it — just capture it.')}
      ${entry('Focus', 'Your today list. Hold at most 3 tasks at a time. When you finish one, pull the next from the Parking Lot.')}
      ${entry('Areas', 'Containers for related tasks (e.g. Work, Personal, Health). Use them to keep things organised and filterable.')}
      ${entry('Parking Lot', 'Tasks that matter but aren\'t urgent today. Promote them to Focus when you have capacity.')}
      ${entry('Archive', 'Completed or shelved tasks you want to keep for reference but no longer act on.')}
      ${entry('Jot', 'A distraction-free scratchpad for continuous writing, thoughts, and free-form notes. Single stream of thinking.')}
      ${entry('Log', 'A historical activity journal and calendar timeline of completed tasks, showing daily productivity recaps, completion metrics, and streaks.')}
      ${entry('Clips', 'A modular, terminal-inspired card scratchpad for quick notes, code snippets, and reference cards with tags and optional Area categorization.')}

      <div class="shortcuts-group-title">Log Module</div>
      <p class="guide-intro">Log provides a clear historical record and reflection tool for your completed work over time.</p>
      ${entry('Purpose', 'Review past accomplishments, observe consistency, and inspect completed tasks without cluttering active workspaces.')}
      ${entry('Calendar View', 'Interactive monthly grid displaying completed task volume per day, active streaks, and a detailed breakdown of items finished on any selected date.')}
      ${entry('Journal View', 'Continuous chronological stream of completed tasks grouped by date for rapid vertical history review.')}
      ${entry('Metrics & Stats', 'Tracks total completed tasks and active completion streaks with visual density indicators inside the calendar grid.')}
      ${entry('Navigation', 'Jump to Log anytime with Alt+7 / ⌥7. Navigate months with arrow buttons or switch views via the header tabs.')}

      <div class="shortcuts-group-title">Clips Module</div>
      <p class="guide-intro">Clips is designed for modular, lightweight reference material without cluttering your actionable task pipeline.</p>
      ${entry('Purpose', 'Keep short reference cards, code snippets, checklists, and snippets readily accessible without treating them as actionable tasks.')}
      ${entry('vs. Jot', 'Jot is one unified scratchpad for long-form free-form writing. Clips are discrete, independently searchable, filterable, and taggable cards.')}
      ${entry('vs. Tasks', 'Tasks move through a strict completion lifecycle (Capture → Focus/Areas → Archive). Clips are permanent reference cards that never appear in task lists.')}
      ${entry('CRUD Operations', 'Create with N or top bar; edit inline with Enter/E or double-click; pin to top with P; archive/restore with A; delete with D/Delete.')}
      ${entry('Search & Tags', 'Live full-text search across titles, content, and #tags with /. Click any #tag chip to filter instantly.')}
      ${entry('Areas', 'Optionally assign clips to an Area for contextual grouping. Clips remain isolated and never affect Area task counts.')}
      ${entry('Views & Sorting', 'Switch between compact Grid view and dense List view. Sort by Recently Updated, Recently Created, or Title (A-Z).')}
      ${entry('Settings', 'Configure default view mode, sort order, preview visibility, deletion confirmation, and default accent tints in Settings (⌘J / Ctrl+J).')}
      ${entry('Shortcuts', 'Navigate cards with j/k or arrow keys; P to pin; A to archive; D/Del to delete; N to create; / to search; Esc to clear/deselect.')}

      <div class="shortcuts-group-title">Why only 3 Focus tasks?</div>
      <p class="guide-intro">Limiting Focus to three tasks forces you to choose what actually matters today. A shorter list means less indecision, less context switching, and more meaningful progress.</p>

    </div>
  `;

  createModal({
    title: 'bench guide',
    contentNode: content
  });
}
