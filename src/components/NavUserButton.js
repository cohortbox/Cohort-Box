import './NavUserButton.css';
import sampleImg from '../images/sample.png';
import { useSocket } from '../context/SocketContext';
import accept from '../images/check-gray.png';
import cancel from '../images/close-gray.png';
import { useAuth } from '../context/AuthContext';

function NavUserButton({ user, isFriend, sentRequest, gotRequest }) {

  const { socket } = useSocket();
  const { accessToken } = useAuth();

  const apiBase = process.env.REACT_APP_API_BASE_URL;

  const callApi = async (url, method, body = null) => {
    const res = await fetch(`${url}`, {
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
      throw new Error(err.error || `API failed: ${url}`);
    }

    return res.json();
  };

  const handleUnfriend = async (e) => {
    e.preventDefault();
    try {
      const result = await callApi(`/api/friends/${user._id}`, 'DELETE');
      
      socket.emit('unfriend', user._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    try {
      const result = await callApi(`/api/friends/request/${user._id}`, 'POST');
      socket.emit('friendRequest', result); // notify other user
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelSentRequest = async (e) => {
    e.preventDefault();
    try {
      const result = await callApi(`/api/friends/request/${user._id}`, 'DELETE');
      socket.emit('cancelFriendRequest', result);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async (e) => {
    e.preventDefault();
    try {
      const result = await callApi(`/api/friends/accept/${user._id}`, 'POST');
      socket.emit('acceptFriendRequest', user._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    try {
      const result = await callApi(`/api/friends/reject/${user._id}`, 'POST');
      socket.emit('rejectFriendRequest', result);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="nub-container">
      <div className="nub-name-img-container">
        <div className="nub-img-container">
          <img className="nub-img" src={sampleImg} alt="profile" />
        </div>
        <div className="nub-name-container">
          <h4 className="nub-name">{user.firstName + ' ' + user.lastName}</h4>
        </div>
      </div>

      <div className="nub-btns-container">
        {isFriend ? (
          <button className="nub-btn" onClick={handleUnfriend}>Unfriend</button>
        ) : sentRequest ? (
          <button className="nub-btn" onClick={handleCancelSentRequest}>Cancel</button>
        ) : gotRequest ? (
          <div className="nub-btn got-request-btn">
            <div className="request-btns">
              <button onClick={handleAccept}>
                <img className="request-btn-img" src={accept} alt="accept" />
              </button>
              <button onClick={handleReject}>
                <img className="request-btn-img" src={cancel} alt="reject" />
              </button>
            </div>
          </div>
        ) : (
          <button className="nub-btn" onClick={handleAddFriend}>Add Friend</button>
        )}
      </div>
    </div>
  );
}

export default NavUserButton;
