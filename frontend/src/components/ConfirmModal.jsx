import React from 'react';

/**
 * Reusable modern modal dialog replacing native window.confirm() & window.alert().
 *
 * @param {boolean}  isOpen       - Whether modal is visible
 * @param {string}   title        - Modal header title
 * @param {string}   message      - Modal body text
 * @param {string}   confirmText  - Label for primary action button (e.g. "Yes, Submit", "Delete")
 * @param {string}   cancelText   - Label for cancel button (e.g. "Cancel")
 * @param {string}   type         - Modal theme: 'danger' | 'warning' | 'info'
 * @param {function} onConfirm    - Callback when confirmed
 * @param {function} onClose      - Callback when cancelled / closed
 */
export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  const iconMap = {
    danger: '🗑️',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const btnColorMap = {
    danger: '#c0392b',
    warning: '#1a3c8f',
    info: '#28a745',
  };

  return (
    <div className="c-modal-overlay" onClick={onClose}>
      <div className="c-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="c-modal-header">
          <span className="c-modal-icon">{iconMap[type] || '⚠️'}</span>
          <h3 className="c-modal-title">{title}</h3>
        </div>

        {message && <p className="c-modal-message">{message}</p>}

        <div className="c-modal-actions">
          {cancelText && (
            <button className="c-modal-btn c-modal-btn-cancel" onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button
            className="c-modal-btn c-modal-btn-confirm"
            style={{ background: btnColorMap[type] || '#1a3c8f' }}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
