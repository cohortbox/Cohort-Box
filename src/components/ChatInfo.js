import './ChatInfo.css'
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

function ChatInfo({selectedChat, chatInfoClass, setChatInfoClass, setMessages}){
    
    const { user } = useAuth();
    const { socket } = useSocket();

    function handleDeleteMessages(e){
        e.preventDefault();
        setMessages([]);
        socket.emit('deleteMessages', {chatId: selectedChat._id, targetId: selectedChat.participants.find(p => p._id !== user.id)._id});
        setChatInfoClass(' hidden')
    }

    return (
        <div className={'chat-info-background-container' + chatInfoClass}>
            <div className={'chat-info-container' + chatInfoClass}>
                <h3 className={'participants-heading' + chatInfoClass}>Participants: </h3>
                <div className={'participant-names-container' + chatInfoClass}>
                    {
                        selectedChat.participants.map((participant, index) => { 
                            return (
                                <div key={index} className='chat-info-participant-name-container'> 
                                    <p className={'participant-name' + chatInfoClass}>{ participant._id === user.id ? 'you' : participant.firstName + ' ' + participant.lastName}</p>
                                    { selectedChat.chatAdmin === participant._id && (
                                        <p className='admin'>Admin</p>
                                    )}
                                </div>
                        )})
                    }
                </div>
                <button className={'delete-chat-msgs-btn' + chatInfoClass} onClick={(e) => handleDeleteMessages(e)}>Delete Chat Messages</button>
            </div>
            <div className={'chat-info-background' + chatInfoClass} onClick={() => setChatInfoClass(' hidden')}></div>
        </div>
    )
}

export default ChatInfo;