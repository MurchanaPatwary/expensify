import React from 'react';
import { AlertTriangle } from 'lucide-react';

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onCancel,
  onConfirm,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <section
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="confirm-icon">
          <AlertTriangle size={20} />
        </div>
        <div className="confirm-copy">
          <h2 id="confirm-dialog-title">{title}</h2>
          <p>{message}</p>
        </div>
        <div className="confirm-actions">
          <button type="button" className="ghost-button compact-button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="danger-button compact-button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;
