import { useEffect, useState } from 'react';

export default function Modal({ isOpen, onClose, children }) {
  const [isRendered, setIsRendered] = useState(isOpen);

  // Handle mount/unmount for CSS animations
  useEffect(() => {
    if (isOpen) setIsRendered(true);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Lock scrolling
      
      const handleEsc = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      
      return () => {
        document.body.style.overflow = ''; // Restore scrolling
        window.removeEventListener('keydown', handleEsc);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  const handleAnimationEnd = () => {
    if (!isOpen) setIsRendered(false);
  };

  if (!isRendered) return null;

  return (
    <div
      className={`modal-overlay ${isOpen ? 'modal-open' : 'modal-closing'}`}
      onAnimationEnd={handleAnimationEnd}
      onClick={onClose}
    >
      <div 
        className="modal-container" 
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
      >
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ×
        </button>
        {children}
      </div>
    </div>
  );
}