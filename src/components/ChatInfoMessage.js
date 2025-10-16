import './ChatInfoMessage.css';

export default function ChatInfoMessage({msg}){
    return (
        <div className='chat-info-msg-container'>
            <div className='chat-info-msg'>
                <span className='chat-info-msg-text'>{msg.message}</span>
            </div>
        </div>  
    )
}