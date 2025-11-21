import './Profile.css';
import userImg from './images/sample.png';
import NavBar from './components/NavBar';
import { useAuth } from './context/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useSocketEvent } from './context/SocketContext';
import NavChatButton from './components/NavChatButton';
import NavUserButton from './components/NavUserButton';
import accept from './images/check-gray.png';
import cancel from './images/close-gray.png';
import addPhoto from './images/add-photo.png'

function Profile(){
    
    const [loading, setLoading] = useState(true);
    const { user, accessToken, logout } = useAuth();
    const { id } = useParams();
    const [userObj, setUserObj] = useState(null); 
    const [chats, setChats] = useState([]);
    const [showChats, setShowChats] = useState(true);
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const isMe = useMemo(() => {
        if (!user || !id) return false;
        return String(id) === String(user.id);
    }, [user, id]);
    const navigate = useNavigate();
    
    useEffect(() => {
        if(!user) return;

        fetch(`/api/return-users/${id}`, {
            method: 'GET',
            headers: {
                'authorization': `Bearer ${accessToken}`
            }
        }).then(response => {
            if(!response.ok){
                throw new Error('Request Failed!')
            }
            return response.json();
        }).then(data => {
            setUserObj(data.userDB);
            setFriends(data.userDB.friends)
            setLoading(false);
        }).catch(err => {
            console.error(err);
        })    
    },[user, accessToken, id]);

    useEffect(() => {
        if(loading) return;

        fetch(`/api/return-user-chats/${id}`, {
            method: 'GET',
            headers: {
                'authorization': `Bearer ${accessToken}`
            }
        }).then(response => {
            if(!response.ok){
                throw new Error('Request Failed!: ' + response.status);
            }
            return response.json();
        }).then(data => {
            setChats(data.chats)
        })

    },[user, loading, id]);

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
    'unfriend',
    (userId) => {
        setFriends(prev =>
            prev.filter(friend => !(String(friend._id) === String(userId) ))
        );
    },
    [user]
    );

    function handleLogout(){
        logout();
        navigate('/login');
    }
    
    const friendIds = useMemo(
        () => new Set(friends?.map(f => String(f._id))),
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
        <div className='profile-container'>
            <title>Profile | CohortBox</title>
            <NavBar/>
            <div className='profile-body-container'>
                <div className='profile-heading-container'>
                    <h4 className='profile-heading'>Profile</h4>
                </div>
                { loading ? ( <div className='spinner-container'><div className='spinner'></div></div> ) : (
                    <div className='profile-info-section'>
                        <div className='profile-info-heading-container'>
                            <div className='profile-info-heading'>
                                <div className='profile-img-container'>
                                    <img className='profile-img' src={userObj.dp}/>
                                    <div className='photo-change-btn'>
                                        <img className='photo-change-img' onClick={() => navigate('/profile-picture')} src={addPhoto}/>
                                    </div>
                                </div>
                                <h4 className='profile-username'>{userObj.firstName + ' ' + userObj.lastName}</h4>
                            </div>
                            {userObj._id === user.id ? (
                                <button className='profile-logout-btn' onClick={handleLogout}>Logout</button>
                            ) : (
                                <div className='profile-actions'>
                                    {(() => {
                                        const id = String(userObj._id);
                                        if (friendIds.has(id)) {
                                            return (
                                                <button className='profile-action-btn unfriend-btn'>
                                                    Unfriend
                                                </button>
                                            );
                                        }
                                        if (outgoingPending.has(id)) {
                                            return (
                                                <button className='profile-action-btn cancel-btn'>
                                                    Cancel Request
                                                </button>
                                            );
                                        }
                                        if (incomingPending.has(id)) {
                                            return (
                                                <div className='profile-request-actions'>
                                                    <button className='accept-btn'>
                                                        <img className="request-btn-img" src={accept} alt="accept" />
                                                    </button>
                                                    <button className='reject-btn'>
                                                        <img className="request-btn-img" src={cancel} alt="reject" />
                                                    </button>
                                                </div>
                                            );
                                        }
                                        return (
                                            <button className='profile-action-btn add-btn'>
                                                Add Friend
                                            </button>
                                        );
                                    })()}
                                </div>
                            ) }
                        </div>

                        <div className='profile-nav-container'>
                            <div className='profile-nav-header'>
                                <button className='profile-nav-btn' onClick={() => setShowChats(true)}>Cohort Boxes</button>
                                <button className='profile-nav-btn'onClick={() => setShowChats(false)}>Friends</button>
                            </div>
                            <div className='profile-nav-body'>
                                { showChats ? (
                                    <div className='profile-chats-container'>
                                        <h4 className='profile-chats-heading'>Cohort Boxes</h4>
                                        { chats.length > 0 ? (
                                            chats.map((chat, index) => (
                                                <Link to={'/' + chat._id} style={{textDecoration: 'none'}}><NavChatButton key={index} chat={chat} setSelectedChat={()=> {return}}/></Link>
                                            )) ) : (
                                                <div className='no-cohort-boxes'>
                                                    { isMe ? 'You have no Cohort Boxes!' : "This user has no Cohort Boxes!" }
                                                </div>
                                            )
                                        }
                                    </div> ) : (
                                    <div className='profile-friends-container'>
                                        <h4 className='profile-friends-heading'>Friends</h4>
                                        { friends?.length > 0 ? (
                                            friends.map((friend, index) => {
                                                const id = String(friend._id);
                                                const isFriend = friendIds.has(id);
                                                const sentRequest = outgoingPending.has(id);
                                                const gotRequest = incomingPending.has(id);
                                                return <Link to={'/profile/' + friend._id} style={{textDecoration: 'none'}}><NavUserButton key={index} user={friend} isFriend={isFriend} sentRequest={sentRequest} gotRequest={gotRequest} setSelectedChat={()=> {return}}/></Link>
                                            }))  : (
                                                <div className='no-friends'>
                                                    { isMe ? 'You have no Friends!' : "This user has no Friends!" }
                                                </div>
                                            )
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    </div> 
                )}
            </div>
        </div>
    )
}

export default Profile;