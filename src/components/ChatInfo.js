import './ChatInfo.css';
import addUserIcon from '../images/add-user.png';
import leaveIcon from '../images/logout.png';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useState } from 'react';
import SearchBar from './SearchBar';
import addPhoto from '../images/add-photo.png'

function ChatInfo({selectedChat, setSelectedChat, chatInfoClass, setChatInfoClass, setMessages}){
    console.log(selectedChat);
    const { user, accessToken } = useAuth();
    const { socket } = useSocket();

    const [searchBarClass, setSearchBarClass] = useState(' hidden');
    const [members, setMembers] = useState([]);

    function handleRemove(e, userId, chatId){
        e.preventDefault();
        fetch(`/api/chat/participant/${encodeURIComponent(userId)}/${encodeURIComponent(chatId)}`, {
            method: 'DELETE',
            headers: {
                'authorization': `Bearer ${accessToken}`
            }
        }).then(response => {
            if(!response.ok){
                throw new Error('Request Failed!');
            }else{
                setSelectedChat(prev => ({
                    ...prev,
                    participants: prev.participants.filter(p => p._id !== userId)
                }));
                socket.emit('participantRemoved', { userId, chatId })
            }
        }).catch(err => {
            console.log(err);
        })
    }

    function handleLeaveChat(e, userId, chatId){
        e.preventDefault();
        fetch(`/api/chat/participant/${encodeURIComponent(userId)}/${encodeURIComponent(chatId)}`, {
            method: 'DELETE',
            headers: {
                'authorization': `Bearer ${accessToken}`
            }
        }).then(response => {
            if(!response.ok){
                throw new Error('Request Failed!');
            }else{
                setSelectedChat(prev => ({
                    ...prev,
                    participants: prev.participants.filter(p => p._id !== userId)
                }));
                setSelectedChat(null);
                socket.emit('participantLeft', { userId, chatId });
            }
        }).catch(err => {
            console.log(err);
        })
    }

    function handleDeleteMessages(e){
        e.preventDefault();
        setMessages([]);
        socket.emit('deleteMessages', {chatId: selectedChat._id, targetId: selectedChat.participants.find(p => p._id !== user.id)._id});
        setChatInfoClass(' hidden')
    }

    return (
        <div className={'chat-info-background-container' + chatInfoClass}>
            <div className={'chat-info-container' + chatInfoClass}>
                <div className='chat-info-heading'>
                    <div className='chat-img-container'>
                        <img className='chat-img' src={selectedChat.dp}/>
                        <div className='photo-change-btn'>
                            <img className='photo-change-img' src={addPhoto}/>
                        </div>
                    </div>
                    <h4 className='chatname'>{selectedChat.chatName}</h4>
                </div>
                <div className='participants-heading-container'>
                    <h3 className={'participants-heading' + chatInfoClass}>Participants: </h3>
                    {
                        selectedChat.chatAdmin === user.id && (
                            <>
                                <button className='add-participant-btn' onClick={() => setSearchBarClass('')}>
                                    <img src={addUserIcon}/>
                                </button>
                            </>
                        )
                    }
                </div>
                <div className={'participant-names-container' + chatInfoClass}>
                    {
                        selectedChat.participants.map((participant, index) => { 
                            return (
                                <div key={index} className='chat-info-participant-container'> 
                                    <div className='chat-info-participant-name-container'>
                                        <p className={'participant-name' + chatInfoClass}>{ participant._id === user.id ? 'you' : participant.firstName + ' ' + participant.lastName}</p>
                                        { selectedChat.chatAdmin === participant._id && (
                                            <p className='admin'>Admin</p>
                                        )}
                                    </div> 
                                    { selectedChat.chatAdmin === user.id && participant._id !== user.id && (<button className='participant-remove-btn' onClick={(e) => handleRemove(e, participant._id, selectedChat._id)}>Remove</button>)}
                                </div>
                        )})
                    }
                </div>
                { selectedChat.participants.some(p =>  p._id === user.id) && selectedChat.chatAdmin !== user.id && <button className='leave-chat-btn' onClick={(e) => handleLeaveChat(e, user.id, selectedChat._id)}><img src={leaveIcon}/> <p>Leave Cohort Box</p></button>}
                <button className={'delete-chat-msgs-btn' + chatInfoClass} onClick={(e) => handleDeleteMessages(e)}>Delete Chat Messages</button>
            </div>
            <SearchBar searchBarClass={searchBarClass} setSearchBarClass={setSearchBarClass} members={members} setMembers={setMembers} chatId={selectedChat._id} addParticipant={true}/>
            <div className={'chat-info-background' + chatInfoClass} onClick={() => setChatInfoClass(' hidden')}></div>
        </div>
    )
}

export default ChatInfo;