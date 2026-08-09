import { createModal } from './modal.js';
import { createButton } from './button.js';
import { Repository } from '../core/repository.js';
import { ToastService } from './toast.js';
import { DialogService } from './dialog.js';

/**
 * Open a dialog to handle Area deletion.
 * Shows move / reassign options if tasks exist, or a simple confirmation if empty.
 * @param {object} area - The Area object to delete
 * @returns {Promise<boolean>} - Resolves to true if deleted, false if cancelled
 */
export function showAreaDeleteDialog(area) {
  return new Promise((resolve) => {
    // Find all tasks associated with this area (both active and archived)
    const allTasks = Repository.getAll().filter(item => 
      item.type !== 'area' && 
      item.areaId === area.id
    );

    // Get other active Areas for the dropdown (exclude this area and archived areas)
    const otherAreas = Repository.getActiveAreas().filter(a => a.id !== area.id);

    // If no tasks, show simple confirm
    if (allTasks.length === 0) {
      DialogService.confirm({
        title: 'Delete Area',
        message: `Are you sure you want to permanently delete the Area [${area.name}]? This action cannot be undone.`,
        confirmText: 'Delete Area',
        cancelText: 'Cancel',
        variant: 'danger'
      }).then((confirmed) => {
        if (confirmed) {
          Repository.deleteArea(area.id);
          ToastService.show('Area deleted.', 'success');
          resolve(true);
        } else {
          resolve(false);
        }
      });
      return;
    }

    // If there are tasks, show the full delete options dialog
    const bodyWrapper = document.createElement('div');
    bodyWrapper.style.display = 'flex';
    bodyWrapper.style.flexDirection = 'column';
    bodyWrapper.style.gap = '16px';

    const infoText = document.createElement('p');
    infoText.textContent = `Area [${area.name}] contains ${allTasks.length} task${allTasks.length === 1 ? '' : 's'}. Please choose how to handle these tasks before deleting:`;
    infoText.style.lineHeight = '1.5';
    bodyWrapper.appendChild(infoText);

    // Option 1: Move to another Area container
    const moveContainer = document.createElement('div');
    moveContainer.style.display = 'flex';
    moveContainer.style.flexDirection = 'column';
    moveContainer.style.gap = '8px';
    moveContainer.style.padding = '12px';
    moveContainer.style.border = '1px solid var(--color-border)';

    const moveLabel = document.createElement('label');
    moveLabel.textContent = 'Move tasks to:';
    moveLabel.style.fontSize = 'var(--font-size-xs)';
    moveLabel.style.color = 'var(--color-text-secondary)';
    moveContainer.appendChild(moveLabel);

    const select = document.createElement('select');
    select.className = 'inspector-select';
    select.style.width = '100%';

    if (otherAreas.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'No other Areas available';
      select.appendChild(opt);
      select.disabled = true;
    } else {
      otherAreas.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = a.name;
        select.appendChild(opt);
      });
    }
    moveContainer.appendChild(select);

    let modalRef = null;

    const moveBtn = createButton({
      text: 'Move tasks and delete Area',
      onClick: () => {
        const targetAreaId = select.value;
        if (!targetAreaId) return;
        Repository.deleteAreaForce(area.id, targetAreaId);
        ToastService.show('Tasks moved and Area deleted.', 'success');
        modalRef.close();
        resolve(true);
      },
      variant: 'primary'
    });
    if (otherAreas.length === 0) {
      moveBtn.disabled = true;
      moveBtn.style.opacity = '0.5';
    }
    moveContainer.appendChild(moveBtn);
    bodyWrapper.appendChild(moveContainer);

    // Option 2: Remove assignment
    const removeBtn = createButton({
      text: 'Remove Area assignment from all tasks',
      onClick: () => {
        Repository.deleteAreaForce(area.id, null);
        ToastService.show('Area assignment removed and Area deleted.', 'success');
        modalRef.close();
        resolve(true);
      },
      variant: 'danger'
    });
    bodyWrapper.appendChild(removeBtn);

    // Cancel Button in footer
    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.justifyContent = 'flex-end';
    footer.style.marginTop = '8px';

    const cancelBtn = createButton({
      text: 'Cancel',
      onClick: () => {
        modalRef.close();
        resolve(false);
      },
      variant: 'secondary'
    });
    footer.appendChild(cancelBtn);
    bodyWrapper.appendChild(footer);

    modalRef = createModal({
      title: 'Delete Area',
      contentNode: bodyWrapper,
      onClose: () => resolve(false)
    });
  });
}
