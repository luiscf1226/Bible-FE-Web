import React, { useEffect } from 'react';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={styles.toast}>
      <p>{message}</p>
      <button onClick={onClose}>&times;</button>
    </div>
  );
};

export default Toast; 