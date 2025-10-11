import './ChatInfo.css';
import addUserIcon from '../images/add-user.png';
import leaveIcon from '../images/logout.png';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

function ChatInfo({selectedChat, setSelectedChat, chatInfoClass, setChatInfoClass, setMessages}){
    
    const { user, accessToken } = useAuth();
    const { socket } = useSocket();

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
            }
        }).catch(err => {
            console.log(err);
        })
    }

    function handleLeaveChat(e){
        e.preventDefault();
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
                <div className='participants-heading-container'>
                    <h3 className={'participants-heading' + chatInfoClass}>Participants: </h3>
                    {
                        selectedChat.chatAdmin === user.id && (
                            <button className='add-participant-btn'>
                                <img src={addUserIcon}/>
                            </button>
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
                                    { selectedChat.chatAdmin === user.id && !participant._id === user.id && (<button className='participant-remove-btn' onClick={(e) => handleRemove(e, participant._id, selectedChat._id)}>Remove</button>)}
                                </div>
                        )})
                    }
                </div>
                { selectedChat.participants.some(p =>  p._id === user.id) && <button className='leave-chat-btn' onClick={handleLeaveChat}><img src={leaveIcon}/> <p>Leave Cohort Box</p></button>}
                <button className={'delete-chat-msgs-btn' + chatInfoClass} onClick={(e) => handleDeleteMessages(e)}>Delete Chat Messages</button>
            </div>
            <div className={'chat-info-background' + chatInfoClass} onClick={() => setChatInfoClass(' hidden')}></div>
        </div>
    )
}

export default ChatInfo;