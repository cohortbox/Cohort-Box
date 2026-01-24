import "./Toast.css";
import { useEffect } from "react";

export default function Toast({ message, show, positivity = false, onClose }) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [show]);

  if (!show) return null;

  return (
    <div className="toast-container" >
      <div className="toast-message" style={{color: positivity ? '#111112' : 'red', backgroundColor: positivity ? '#1ff200' : '#ffcccc'}}>
        {message}
      </div>
    </div>
  );
}
