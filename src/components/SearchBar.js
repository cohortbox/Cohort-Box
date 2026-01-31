import './SearchBar.css'
import searchImg from '../images/magnifying-glass.png';
import closeImg from '../images/close.png';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import Toast from './Toast';

function SearchBar({ searchBarClass, setSearchBarClass, members, setMembers, chatId, addParticipant, selectedChat = null }){
    const navigate = useNavigate();
    const [users, setUsers] = useState([])
    const [query, setQuery] = useState('');
    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false)
    const { accessToken, user } = useAuth();
    const { socket } = useSocket();

    function showAlert(msg) {
        setToastMessage(msg);
        setShowToast(true);
    }

    function HideSearch(){
        setSearchBarClass(' hidden')
    }

    useEffect(() => {
        fetch(`/api/friends`, {
            method: 'GET',
            headers: {
                'authorization': `Bearer ${accessToken}`
            },
            credentials: 'include'
        }).then(response => {
            if(!response.ok){
                throw new Error('Request Failed!');
            }
            return response.json();
        }).then(data => {
            setUsers(data.friends);
        }).catch(err => {
            console.error(err);
            navigate('/crash');
        })
    }, [])

    function handleSearch(e){
        e.preventDefault();
        if(!query || !query.trim()) return;
        fetch(`/api/friends?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'authorization': `Bearer ${accessToken}`
            },
            credentials: 'include'
        }).then(response => {
            if(!response.ok){
                throw new Error('Request Failed!');
            }
            return response.json();
        }).then(data => {
            setUsers(data.friends);
        }).catch(err => {
            console.error(err);
            navigate('/crash');
        })
    }

    function handleAdd(e, user){
        e.preventDefault();
        setMembers(prev => {
            for(const member of prev){
                if(member._id === user._id) return prev;
            }
            return [...prev, user]
        })
    }

    function handleRemove(e, id){
        e.preventDefault();
        setMembers(prev => prev.filter(member => member._id !== id));
    }

    function handleAddParticipants(e){
        e.preventDefault();
        if(!selectedChat) return;
        if(!chatId) return;
        if(members.length === 0) return;

        const participants = [];

        for(let member of members){
            participants.push(member._id);
        }

        const body = {
            participants,
            chatId
        }

        fetch('api/chat/participant', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${accessToken}`
            },
            credentials: 'include',
            body: JSON.stringify(body)
        }).then(response => {
            if(!response.ok){
                throw new Error('Request Failed!');
            }else{
                for (let participant of participants){
                    const intendedMember = members.find(
                        m => String(m._id) === String(participant)
                    );

                    if (!intendedMember) continue;

                    fetch('/api/notification', {
                        method: 'POST',
                        headers: {
                            'authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            user: participant,
                            sender: selectedChat.chatAdmin,
                            type: 'added_to_group_request',
                            chat: selectedChat._id,
                            message: null,
                            text: '',
                        })
                    }).then(res => {
                        if(!res.ok){
                            throw new Error();
                        }
                        return res.json();
                    }).then(data => {
                        const notification = data.notification;
                        socket.emit('notification', notification);
                    })

                    fetch('/api/message', {
                        method: 'POST',
                        headers: {
                            'authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            from: user.id,
                            chatId,
                            type: 'chatInfo',
                            message: `Admin requested ${intendedMember.username} to join this chat.`,
                            isReply: false,
                            repliedTo: null,
                            media: [],
                            reactions: []
                        })
                    }).then(res => {
                        if(!res.ok){
                            throw new Error();
                        }
                        return res.json();
                    }).then(data => {
                        socket.emit('participantAdded', { userId: participant, chatId, message: data.message });
                    }).catch(err => {
                        console.error(err);
                        navigate('/crash')
                    })
                }
                setMembers([]);
                setSearchBarClass(' hidden');
            }
        }).catch(err => {
            console.error(err);
            navigate('/crash')
        })
    }

    return (
        <div className={'search-bar' + searchBarClass}>
            <div className={'form-usersbox-container' + searchBarClass} style={{width: `${addParticipant ? '100%' : '80%'}`}}>
                <form onSubmit={handleSearch} className='search-bar-form'>
                    <input className={'search-input' + searchBarClass} placeholder='Search' onChange={(e) => setQuery(e.target.value)}/>
                </form>
                <div className='selected-users-box'>
                    {
                        members.length > 0 ? (
                            members.map((member, index) => 
                                <div key={index} className='selected-member-container'>
                                    <h5 className='selected-member-name'>{member.firstName + " " + member.lastName}</h5>
                                    <button className='close-btn' onClick={(e) => handleRemove(e, member._id)}><img className='close-img' src={closeImg}/></button>
                                </div>
                            )
                        ) : (
                            <p>No Users Selected</p>
                        )
                    }
                </div>
                <div className={'users-box' + searchBarClass}>
                    <div>
                        { addParticipant ? 
                            users
                                .filter(u => {
                                    if (u._id === user.id) return false;

                                    if (addParticipant && selectedChat?.participants) {
                                        return !selectedChat.participants.some(
                                            p => String(p._id) === String(u._id)
                                        );
                                    }

                                    return true;
                                })
                                .map((u, index) => (
                                    <div key={index} className={'user' + searchBarClass}>
                                        <h2>{u.firstName + ' ' + u.lastName}</h2>

                                        {members.some(m => m._id === u._id) ? (
                                            <button className='add-friend-btn' disabled>Added</button>
                                        ) : (
                                            <button
                                                className='add-friend-btn'
                                                onClick={(e) => handleAdd(e, u)}
                                            >
                                                Add
                                            </button>
                                        )}
                                    </div>
                                ))
                            :
                            users.length > 0 ? 
                                users.map((u, index) => {
                                    if(u._id === user.id) return;
                                    return (
                                        <div key={index} className={'user' + searchBarClass}>
                                            <h2>{u.firstName + ' ' + u.lastName}</h2>
                                            {   !members.includes(u) ? (
                                                    <button className='add-friend-btn' onClick={(e) => handleAdd(e, u)}>Add</button> 
                                                ) :
                                                (
                                                    <button className='add-friend-btn' disabled>Added</button> 
                                                )
                                            }
                                        </div>
                                        )
                                }) 
                        
                        : (
                            <p className={'no-user-paragraph' + searchBarClass}>No users found!</p>
                        )}
                    </div>
                </div> 
                { addParticipant && <button className='search-bar-add-participant-btn' onClick={handleAddParticipants}>Add</button> }
            </div>
            <div className={'search-background' + searchBarClass} onClick={HideSearch}></div>
            {/* <button className='search-btn' onClick={() => { setSearchBarClass('') }}><img className='search-img' src= {searchImg} alt='Search Icon' /></button> */}
            <Toast
                message={toastMessage}
                show={showToast}
                onClose={() => setShowToast(false)}
            />
        </div>
    )
}

export default SearchBar;