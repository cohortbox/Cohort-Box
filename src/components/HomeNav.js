import './HomeNav.css';
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import searchIcon from '../images/magnifying-glass.png';
import NavChatButton from './NavChatButton';
import NavUserButton from './NavUserButton';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../context/SocketContext';

function ChatsNav({ users, chats, selectedChat, setSelectedChat }) {
  const { user, accessToken, loading } = useAuth();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [currFilter, setCurrFilter] = useState('cb');

  useEffect(() => {
    if (!accessToken || loading) return;
    fetch(`/api/return-friends`, {
      method: 'GET',
      headers: { authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    })
      .then(r => {
        if (!r.ok) {
          if (r.status === 404) {
            setFriends([]);
            return null;
          }
          throw new Error('Request Failed with Status: ' + r.status);
        }
        return r.json();
      })
      .then(data => data && setFriends(data.friends || []))
      .catch(err => console.error('Error fetching friends:', err));
  }, [accessToken, loading]);

  useEffect(() => {
    if (!accessToken || loading) return;
    fetch(`/api/return-friend-requests`, {
      method: 'GET',
      headers: { authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    })
      .then(r => {
        if (!r.ok) throw new Error('Request Failed with Status: ' + r.status);
        return r.json();
      })
      .then(data => setFriendRequests(data.requests || []))
      .catch(err => console.error('Error fetching friend requests:', err));
  }, [accessToken, loading]);

  useSocketEvent(
    'friendRequestSent',
    (request) => {
      setFriendRequests(prev => [...prev, request]);
    },
    [user]
  );

  useSocketEvent(
    'friendRequestReceived',
    (request) => {
      setFriendRequests(prev => [...prev, request]);
    },
    [user]
  );

  useSocketEvent(
    'friendRequestCanceled',
    ({ from, to }) => {
      setFriendRequests(prev =>
        prev.filter(fr => !(String(fr.from._id) === String(from) && String(fr.to._id) === String(to)))
      );
    },
    [user]
  );

  useSocketEvent(
    'friendRequestAccepted',
    ({ from, to, friendObj }) => {
      setFriendRequests(prev =>
        prev.filter(fr => !(String(fr.from._id) === String(from) && String(fr.to._id) === String(to)))
      );
      setFriends(prev => [...prev, friendObj])
    },
    [user]
  );

  useSocketEvent(
    'friendRequestRejected',
    ({ from, to }) => {
      setFriendRequests(prev =>
        prev.filter(fr => !(String(fr.from._id) === String(from) && String(fr.to._id) === String(to)))
      );
    },
    [user]
  );

  useSocketEvent(
    'unfriend',
    (userId) => {
      setFriends(prev =>
        prev.filter(friend => !(String(friend._id) === String(userId) ))
      );
    },
    [user]
  );


  const friendIds = useMemo(
    () => new Set(friends.map(f => String(f._id))),
    [friends]
  );

  const outgoingPending = useMemo(
    () =>
      new Set(
        friendRequests
          .filter(r => String(r.from._id) === String(user?.id) && r.status === 'pending')
          .map(r => String(r.to._id))
      ),
    [friendRequests, user?.id]
  );

  const incomingPending = useMemo(
    () =>
      new Set(
        friendRequests
          .filter(r => String(r.to._id) === String(user?.id) && r.status === 'pending')
          .map(r => String(r.from._id))
      ),
    [friendRequests, user?.id]
  );

  return (
    <div className='cn-container'>
      <div className='cn-heading-container'>
        <h3 className='cn-heading'>MY COHORT BOXES</h3>
      </div>

      <div className='cn-body-container'>
        <div className='cn-searchbar-container'>
          <img className='cn-search-icon' src={searchIcon}/>
          <input className='cn-search-input' placeholder='SEARCH COHORTIAN/COHORT BOX'/>
        </div>

        <div className='cn-filter-container'>
          <button className={'cn-filter-btn' + (currFilter === 'cb' ? ' active-filter-btn' : '')} onClick={() => setCurrFilter('cb')}>Cohort Boxes</button>
          <button className={'cn-filter-btn' + (currFilter === 'people' ? ' active-filter-btn' : '')} onClick={() => setCurrFilter('people')}>People</button>
        </div>

        <div className='cn-chats-container'>
          {currFilter === 'cb'
            ? chats.map(chat => (
                <NavChatButton key={chat._id || chat.id} chat={chat} setSelectedChat={setSelectedChat}/>
              ))
            : users.map(u => {
                const id = String(u._id);
                const isFriend = friendIds.has(id);
                const sentRequest = outgoingPending.has(id);
                const gotRequest = incomingPending.has(id);

                return (
                  <Link to={'/profile/' + u._id} style={{ textDecoration: 'none' }} key={u._id}>
                    <NavUserButton
                      user={u}
                      isFriend={isFriend}
                      sentRequest={sentRequest}
                      gotRequest={gotRequest}
                    />
                  </Link>
                );
              })}
        </div>
      </div>
    </div>
  );
}

export default ChatsNav;
