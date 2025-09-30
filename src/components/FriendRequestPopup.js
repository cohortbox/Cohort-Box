import './FriendRequestPopup.css';
import { useSocketEvent } from '../context/SocketContext';
import { useState, useEffect } from 'react';
import accept from '../images/check-gray.png';
import cancel from '../images/close-gray.png';

function FriendRequestPopup() {
  const [incomingRequests, setIncomingRequests] = useState([]);

  useSocketEvent("friendRequestReceived", (request) => {
    setIncomingRequests((prev) => [...prev, { ...request, show: true }]);
  }, []);

  const handleAccept = (req) => {
    console.log("Accepted request from:", req.from);
    removePopup(req._id);
    // TODO: emit accept to server
  };

  const handleReject = (req) => {
    console.log("Rejected request from:", req.from);
    removePopup(req._id);
    // TODO: emit reject to server
  };

  const removePopup = (id) => {
    setIncomingRequests((prev) =>
      prev.map((r) => (r._id === id ? { ...r, show: false } : r))
    );
    // wait for animation to finish before removing from state
    setTimeout(() => {
      setIncomingRequests((prev) => prev.filter((r) => r._id !== id));
    }, 500); // match slide-out duration
  };

  // auto-dismiss after 3s
  useEffect(() => {
    if (incomingRequests.length === 0) return;
    const timers = incomingRequests.map((req) =>
      setTimeout(() => removePopup(req._id), 3000)
    );
    return () => timers.forEach(clearTimeout);
  }, [incomingRequests]);

  return (
    <div className="popup-container">
      {incomingRequests.map((req) => (
        <div
          key={req._id}
          className={`popup ${req.show ? 'slide-in' : 'slide-out'}`}
        >
          <p>
            <b>{req.from.firstName + " " + req.from.lastName}</b> sent you a friend request
          </p>
          <div className="popup-buttons">
            <button onClick={() => handleAccept(req)}><img className='popup-btn-img' src={accept}/></button>
            <button onClick={() => handleReject(req)}><img className='popup-btn-img' src={cancel}/></button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FriendRequestPopup;
