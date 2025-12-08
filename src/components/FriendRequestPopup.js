import './FriendRequestPopup.css';
import { useSocket, useSocketEvent } from '../context/SocketContext';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';
import accept from '../images/check-gray.png';
import cancel from '../images/close-gray.png';

function FriendRequestPopup() {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const { socket } = useSocket();
  const { user, accessToken } = useAuth();
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false)

  function showAlert(msg) {
    setToastMsg(msg);
    setShowToast(true)
  }

  const apiBase = process.env.REACT_APP_API_BASE_URL;

  const callApi = async (url, method, body = null) => {
    const res = await fetch(`${apiBase}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${accessToken}`
      },
      credentials: 'include',
      body: body ? JSON.stringify(body) : null,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showAlert('An Error Occurred!')
      throw new Error(err.error || `API failed: ${url}`);
    }

    return res.json();
  };

  useSocketEvent("friendRequestReceived", (request) => {
    setIncomingRequests((prev) => [...prev, { ...request, show: true }]);
  }, []);

  const handleAccept = async (e, req) => {
    e.preventDefault();
    try {
      const result = await callApi(`/api/friends/accept/${user._id}`, 'POST');
      socket.emit('acceptFriendRequest', user._id);
      socket.emit('notification', result.notification)
      removePopup(req._id)
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (e, req) => {
    e.preventDefault();
    try {
      const result = await callApi(`/api/friends/reject/${user._id}`, 'POST');
      socket.emit('rejectFriendRequest', result);
      removePopup(req._id)
    } catch (err) {
      console.error(err);
    }
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
            <button onClick={(e) => handleAccept(e, req)}><img className='popup-btn-img' src={accept}/></button>
            <button onClick={(e) => handleReject(e, req)}><img className='popup-btn-img' src={cancel}/></button>
          </div>
        </div>
      ))}
      <Toast message={toastMsg} show={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}

export default FriendRequestPopup;

