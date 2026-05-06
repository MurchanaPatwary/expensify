import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

function Snackbar({ snackbar, onClose }) {
  useEffect(() => {
    if (!snackbar) {
      return undefined;
    }

    const timeoutId = window.setTimeout(onClose, 2800);
    return () => window.clearTimeout(timeoutId);
  }, [snackbar, onClose]);

  if (!snackbar) {
    return null;
  }

  return (
    <div className="snackbar" role="status" aria-live="polite">
      <CheckCircle2 size={18} />
      <p>{snackbar.message}</p>
      <button type="button" className="snackbar-close" onClick={onClose} aria-label="Close">
        <X size={16} />
      </button>
    </div>
  );
}

export default Snackbar;
